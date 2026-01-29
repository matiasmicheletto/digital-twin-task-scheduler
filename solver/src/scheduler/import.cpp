#include "scheduler.h"

void Scheduler::loadScheduleFromDatFile(const std::string& file_path) {
    std::ifstream file(file_path);
    if (!file.is_open()) {
        utils::throw_runtime_error("Could not open file: " + file_path);
    }

    try {
        // ===== Parse Nodes =====
        utils::dbg << "Parsing nodes...\n";
        int numNodes;
        file >> numNodes;
        file.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

        servers.reserve(numNodes);
        std::map<int, std::string> nodeIdMap; // Map numeric IDs to generated UUIDs
        std::map<int, int> nodeIndexMap; // Map numeric IDs to internal indices

        for (int i = 0; i < numNodes; i++) {
            int nodeIndex;
            double memory, u;
            file >> nodeIndex >> memory >> u;
            file.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

            Server server(
                ServerType::Edge, // Initially set as Edge, will update if MIST task allocated
                //"Node " + std::to_string(nodeIndex),
                std::to_string(nodeIndex),
                static_cast<int>(memory),
                1, // Default cost
                u
            );
            server.setInternalIdx(i);
            nodeIndexMap[nodeIndex] = i;
            nodeIdMap[nodeIndex] = server.getId();
            servers.push_back(server);
        }
        utils::dbg << "Parsed " << servers.size() << " nodes.\n";

        // ===== Parse Tasks =====
        utils::dbg << "Parsing tasks...\n";
        int lastTaskIndex;
        file >> lastTaskIndex;
        file.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

        int taskCount = lastTaskIndex + 1;
        tasks.reserve(taskCount);
        std::map<int, std::string> taskIdMap; // Map numeric IDs to generated UUIDs
        std::map<int, int> taskIndexMap; // Map numeric IDs to internal indices

        for (int i = 0; i < taskCount; i++) {
            int taskIndex, allocatedNode;
            double C, T, D, a, M;
            file >> taskIndex >> C >> T >> D >> a >> M >> allocatedNode;
            file.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

            bool isMist = (allocatedNode != 0);

            Task task(
                isMist ? TaskType::Mist : TaskType::Regular,
                //isMist ? ("Mst " + std::to_string(taskIndex)) : ("Tsk " + std::to_string(taskIndex)),
                std::to_string(taskIndex),
                isMist,
                static_cast<int>(C),
                static_cast<int>(T),
                static_cast<int>(D),
                static_cast<int>(M),
                static_cast<int>(a)
            );

            task.setInternalIdx(i);

            // Calculate utilization
            if (task.getT() <= 0) {
                utils::throw_runtime_error("Task " + std::to_string(taskIndex) + " has invalid period T");
            }

            // Handle fixed allocation
            if(isMist) {
                int serverInternalIdx = nodeIndexMap[allocatedNode];

                // Update server type to MIST
                if (servers[serverInternalIdx].getType() != ServerType::Mist) {
                    servers[serverInternalIdx] = Server(
                        ServerType::Mist,
                        //"MIST " + std::to_string(allocatedNode),
                        std::to_string(allocatedNode),
                        servers[serverInternalIdx].getMemory(),
                        servers[serverInternalIdx].getCost(),
                        servers[serverInternalIdx].getUtilization()
                    );
                    servers[serverInternalIdx].setInternalIdx(serverInternalIdx);
                    
                    // IMPORTANT: Update nodeIdMap with the new server ID
                    nodeIdMap[allocatedNode] = servers[serverInternalIdx].getId();
                }
                
                // Now set the fixed allocation using the updated ID
                task.setFixedAllocationId(nodeIdMap[allocatedNode]);
                task.setFixedAllocationInternalId(serverInternalIdx);
            }

            task.setStartTime(0); // Finish time will be start + C - 1, but not used yet

            taskIdMap[taskIndex] = task.getId();
            taskIndexMap[taskIndex] = i;
            tasks.push_back(task);
        }
        utils::dbg << "Parsed " << tasks.size() << " tasks.\n";

        // Update non_mist_servers_idxs
        non_mist_servers_idxs.clear();
        for (const auto& server : servers) {
            if (server.getType() != ServerType::Mist) {
                non_mist_servers_idxs.push_back(server.getInternalIdx());
            }
        }

        // ===== Parse Precedences =====
        utils::dbg << "Parsing precedences...\n";
        int precedencesCount;
        file >> precedencesCount;
        file.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

        int actualPrecedences = 0;
        for (int i = 0; i < precedencesCount; i++) {
            int fromTaskIndex, toTaskIndex, exists;
            file >> fromTaskIndex >> toTaskIndex >> exists;
            file.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

            if (exists == 1) {
                std::string fromUuid = taskIdMap[fromTaskIndex];
                std::string toUuid = taskIdMap[toTaskIndex];
                int fromInternal = taskIndexMap[fromTaskIndex];
                int toInternal = taskIndexMap[toTaskIndex];

                // Add predecessor to 'to' task
                tasks[toInternal].addPredecessor(fromUuid, fromInternal);
                
                // Add successor to 'from' task
                tasks[fromInternal].addSuccessor(toUuid, toInternal);
                
                actualPrecedences++;
            }
        }
        utils::dbg << "Parsed " << actualPrecedences << " precedences.\n";

        // ===== Parse Connections =====
        utils::dbg << "Parsing connections...\n";
        int connectionCount;
        file >> connectionCount;
        file.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

        connections.reserve(connectionCount);
        int actualConnections = 0;

        for (int i = 0; i < connectionCount; i++) {
            int fromId, toId;
            double delay;
            file >> fromId >> toId >> delay;
            file.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

            // Ignore self-connections and infinite delays
            if (delay != 0 && delay != 1000 && fromId != toId) {
                Connection conn;
                std::string fromUuid = nodeIdMap[fromId];
                std::string toUuid = nodeIdMap[toId];
                
                conn.id = fromUuid + "_" + toUuid;
                conn.from_server_id = fromUuid;
                conn.to_server_id = toUuid;
                conn.delay = static_cast<int>(delay);
                conn.bidirectional = false;
                conn.from_server_index = nodeIndexMap[fromId];
                conn.to_server_index = nodeIndexMap[toId];
                
                connections.push_back(conn);
                actualConnections++;
            }
        }
        utils::dbg << "Parsed " << actualConnections << " connections.\n";

    } catch (const std::exception& e) {
        utils::throw_runtime_error("Error parsing DAT file: " + std::string(e.what()));        
    }

    file.close();
    
    utils::dbg << "Successfully loaded network from " << file_path << "\n";
    utils::dbg << "Total servers: " << servers.size() << ", Total tasks: " << tasks.size() 
               << ", Total connections: " << connections.size() << "\n";
}

void Scheduler::loadTasksFromJSONFile(const std::string& file_path) {

    std::ifstream file(file_path);
    if (!file.is_open()) {
        utils::throw_runtime_error("Could not open file: " + file_path);
    }

    nlohmann::json j;
    file >> j;

    // json structure:
    // {
    //   "metadata": { ... },
    //   "tasks": [ ... ],
    //   "precedences": [ ... ]
    // }

    if (!j.contains("tasks") || !j.at("tasks").is_array()) {
        utils::throw_runtime_error("JSON file does not contain a valid 'tasks' array");
    }

    size_t num_tasks = j.at("tasks").size();
    tasks.reserve(num_tasks);
    int task_index = 0;
    for (const auto& jt : j.at("tasks")) {
        try {
            tasks.emplace_back(Task::fromJSON(jt));
            tasks.back().setInternalIdx(task_index);
            task_index++;
        } catch (const std::exception& e) {
            utils::throw_runtime_error("Failed to load task " + std::to_string(task_index + 1) + ": " + std::string(e.what()));
        }
    }

    // Compute predecessors from precedences (successors are already in tasks)
    if (j.contains("precedences") && j.at("precedences").is_array()) {
        for (const auto& jp : j.at("precedences")) {
            std::string from_id = utils::require_type<std::string>(jp, "from");
            std::string to_id = utils::require_type<std::string>(jp, "to");

            // Add predecessor
            auto from_it = std::find_if(tasks.begin(), tasks.end(), [&](const Task& t) {
                return t.getId() == from_id;
            });
            if (from_it == tasks.end())
                utils::throw_runtime_error("Invalid from_id in precedence: " + from_id);
            
            auto to_it = std::find_if(tasks.begin(), tasks.end(), [&](const Task& t) {
                return t.getId() == to_id;
            });
            if (to_it == tasks.end()) 
                utils::throw_runtime_error("Invalid to_id in precedence: " + to_id);

            // Add predecessor to the 'to' task
            int from_internal = from_it->getInternalIdx();
            to_it->addPredecessor(from_id, from_internal);
            
            int to_internal = to_it->getInternalIdx();
            from_it->addSuccessor(to_id, to_internal);
        }
    }
}

void Scheduler::loadNetworkFromJSONFile(const std::string& file_path) {
    // Must be executed after loading tasks to map allocated tasks to servers indices

    std::ifstream file(file_path);
    if (!file.is_open()) {
        utils::throw_runtime_error("Could not open file: " + file_path);
    }

    nlohmann::json j;
    file >> j;

    // json structure:
    // {
    //   "nodes": [ ... ],
    //   "connections": [ ... ]
    // }

    if (!j.contains("nodes") || !j.at("nodes").is_array()) {
        utils::throw_runtime_error("JSON file does not contain a valid 'nodes' array");
    }

    servers.reserve(j.at("nodes").size());
    int server_index = 0;
    for (const auto& jn : j.at("nodes")) {
        Server server = Server::fromJSON(jn);
        server.setInternalIdx(server_index);
        server_index++;
        servers.push_back(server);
        if(server.getType() != ServerType::Mist) {
            non_mist_servers_idxs.push_back(server.getInternalIdx());
        }
    }

    utils::dbg << "Loaded " << servers.size() << " servers from " << file_path << "\n";

    // Find tasks preallocated to servers and map to server indices
    size_t fixedAllocationCount = 0;
    for (auto& task : tasks) {
        if (task.hasFixedAllocation()) {
            std::string server_id = task.getFixedAllocationTo();
            auto server = std::find_if(servers.begin(), servers.end(), [&](const Server& s) {
                return s.getId() == server_id;
            });
            if (server == servers.end()) {
                utils::throw_runtime_error("Task " + task.getId() + " has invalid fixed allocation to server: " + server_id);
            }
            task.setFixedAllocationInternalId(server->getInternalIdx());
            fixedAllocationCount++;
        }
    }

    utils::dbg << "Mapped fixed allocations for " << fixedAllocationCount << " tasks.\n";


    if (!j.contains("connections") || !j.at("connections").is_array()) {
        utils::throw_runtime_error("JSON file does not contain a valid 'connections' array");
    }

    connections.reserve(j.at("connections").size());

    for (const auto& jc : j.at("connections")) {
        Connection conn;
        conn.id = utils::require_type<std::string>(jc, "id");
        conn.from_server_id = utils::require_type<std::string>(jc, "from");
        conn.to_server_id = utils::require_type<std::string>(jc, "to");
        conn.delay = utils::require_type<int>(jc, "delay");
        conn.bidirectional = utils::require_type<bool>(jc, "bidirectional");
        
        // Map server IDs to indices
        auto from_it = std::find_if(servers.begin(), servers.end(), [&](const Server& s) {
            return s.getId() == conn.from_server_id;
        });
        if (from_it == servers.end()) {
            utils::throw_runtime_error("Invalid from_server_id in connection: " + conn.id);
        };
        conn.from_server_index = std::distance(servers.begin(), from_it);
        
        auto to_it = std::find_if(servers.begin(), servers.end(), [&](const Server& s) {
            return s.getId() == conn.to_server_id;
        });
        if (to_it == servers.end()) {
            utils::throw_runtime_error("Invalid to_server_id in connection: " + conn.id);
        };
        conn.to_server_index = std::distance(servers.begin(), to_it);
        
        connections.push_back(conn);
    }

    utils::dbg << "Loaded " << connections.size() << " connections from " << file_path << "\n";
}