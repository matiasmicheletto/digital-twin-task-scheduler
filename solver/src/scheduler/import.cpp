#include "scheduler.h"

void Scheduler::loadTasksFromJSONFile(const std::string& file_path) {

    std::ifstream file(file_path);
    if (!file.is_open()) {
        std::cerr << "Could not open file: " + file_path << std::endl;
        throw std::runtime_error("Could not open file: " + file_path);
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
        throw std::runtime_error("JSON file does not contain a valid 'tasks' array");
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
            throw std::runtime_error("Failed to load task " + std::to_string(task_index + 1) + ": " + std::string(e.what()));
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
                throw std::runtime_error("Invalid from_id in precedence: " + from_id);
            
            auto to_it = std::find_if(tasks.begin(), tasks.end(), [&](const Task& t) {
                return t.getId() == to_id;
            });
            if (to_it == tasks.end()) 
                throw std::runtime_error("Invalid to_id in precedence: " + to_id);

            int from_internal = from_it->getInternalIdx();
            int to_internal = to_it->getInternalIdx();
            
            // Add predecessor to the 'to' task
            to_it->addPredecessor(from_id, from_internal);
            
            // ADD THIS: Add successor to the 'from' task
            from_it->addSuccessor(to_id, to_internal);
        }
    }
}

void Scheduler::loadNetworkFromJSONFile(const std::string& file_path) {
    // Must be executed after loading tasks to map allocated tasks to servers indices

    std::ifstream file(file_path);
    if (!file.is_open()) {
        std::cerr << "Could not open file: " + file_path << std::endl;
        throw std::runtime_error("Could not open file: " + file_path);
    }

    nlohmann::json j;
    file >> j;

    // json structure:
    // {
    //   "nodes": [ ... ],
    //   "connections": [ ... ]
    // }

    if (!j.contains("nodes") || !j.at("nodes").is_array()) {
        throw std::runtime_error("JSON file does not contain a valid 'nodes' array");
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
                throw std::runtime_error("Task " + task.getId() + " has invalid fixed allocation to server: " + server_id);
            }
            task.setFixedAllocationInternalId(server->getInternalIdx());
            fixedAllocationCount++;
        }
    }

    utils::dbg << "Mapped fixed allocations for " << fixedAllocationCount << " tasks.\n";


    if (!j.contains("connections") || !j.at("connections").is_array()) {
        throw std::runtime_error("JSON file does not contain a valid 'connections' array");
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
            throw std::runtime_error("Invalid from_server_id in connection: " + conn.id);
        };
        conn.from_server_index = std::distance(servers.begin(), from_it);
        
        auto to_it = std::find_if(servers.begin(), servers.end(), [&](const Server& s) {
            return s.getId() == conn.to_server_id;
        });
        if (to_it == servers.end()) {
            throw std::runtime_error("Invalid to_server_id in connection: " + conn.id);
        };
        conn.to_server_index = std::distance(servers.begin(), to_it);
        
        connections.push_back(conn);
    }

    utils::dbg << "Loaded " << connections.size() << " connections from " << file_path << "\n";
}