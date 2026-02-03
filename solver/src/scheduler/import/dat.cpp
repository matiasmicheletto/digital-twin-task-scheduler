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
            int cost = 1; // Default value if not present
            
            file >> nodeIndex >> memory >> u;
            
            // Try to read optional cost field
            std::streampos pos = file.tellg(); // Save current position
            if (!(file >> cost)) {
                // Cost not present, clear error and restore position
                file.clear();
                file.seekg(pos);
                cost = 1; // Use default value
            }
            
            file.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

            Server server(
                ServerType::Edge,
                std::to_string(nodeIndex),
                static_cast<int>(memory),
                cost, // Use the cost value (either read or default)
                u
            );
            server.setId(std::to_string(nodeIndex)); // Dat files use numeric IDs
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
                std::to_string(taskIndex), // Use numeric ID as label
                isMist,
                static_cast<int>(C),
                static_cast<int>(T),
                static_cast<int>(D),
                static_cast<int>(M),
                static_cast<int>(a)
            );
            task.setId(std::to_string(taskIndex)); // Dat files use numeric IDs
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
                    servers[serverInternalIdx].setId(std::to_string(allocatedNode));
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
};