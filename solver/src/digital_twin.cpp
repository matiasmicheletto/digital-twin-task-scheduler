#include "../include/digital_twin.h"

DigitalTwin::DigitalTwin(std::string tasks_file, std::string network_file) {
    // Sets up the digital twin by loading tasks and network from JSON files
    // Delay matrix is used to define start and finish times of tasks based on communication delays
    loadTasksFromJSONFile(tasks_file);
    loadNetworkFromJSONFile(network_file);
    computeDelayMatrix();
}

void DigitalTwin::computeDelayMatrix() {
    // Computes the delay matrix based on connections. If no direct connection, delay is computed by minimal paths.
    int n = servers.size();
    delay_matrix.resize(n, std::vector<int>(n, INT_MAX));
    for (int i = 0; i < n; ++i) {
        delay_matrix[i][i] = 0; // Zero delay to self
    }
    for (const auto& conn : connections) {
        delay_matrix[conn.from_server_index][conn.to_server_index] = conn.delay;
        if (conn.bidirectional) {
            delay_matrix[conn.to_server_index][conn.from_server_index] = conn.delay;
        }
    }
    // Floyd-Warshall algorithm for all-pairs shortest paths
    for (int k = 0; k < n; ++k) {
        for (int i = 0; i < n; ++i) {
            for (int j = 0; j < n; ++j) {
                if (delay_matrix[i][k] != INT_MAX && delay_matrix[k][j] != INT_MAX) {
                    delay_matrix[i][j] = std::min(delay_matrix[i][j], delay_matrix[i][k] + delay_matrix[k][j]);
                }
            }
        }
    }
}

void DigitalTwin::loadTasksFromJSONFile(const std::string& file_path) {

    std::ifstream file(file_path);
    if (!file.is_open()) {
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

    
    tasks.reserve(j.at("tasks").size());

    for (const auto& jt : j.at("tasks")) {
        tasks.push_back(Task::fromJSON(jt));
    }

    // Compute predecessors from precedences
    if (j.contains("precedences") && j.at("precedences").is_array()) {
        for (const auto& jp : j.at("precedences")) {
            std::string from_id = utils::require_type<std::string>(jp, "from");
            std::string to_id = utils::require_type<std::string>(jp, "to");

            auto to_it = std::find_if(tasks.begin(), tasks.end(), [&](const Task& t) {
                return t.getId() == to_id;
            });
            if (to_it != tasks.end()) {
                to_it->addPredecessor(from_id);
            } else {
                throw std::runtime_error("Invalid to_id in precedence: " + to_id);
            }
        }
    }
}

void DigitalTwin::loadNetworkFromJSONFile(const std::string& file_path) {

    std::ifstream file(file_path);
    if (!file.is_open()) {
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

    for (const auto& jn : j.at("nodes")) {
        servers.push_back(Server::fromJSON(jn));
    }

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
}

void DigitalTwin::schedule(Candidate candidate) {
    // Schedules tasks onto servers based on the candidate solution

    for (size_t server_idx = 0; server_idx < servers.size(); ++server_idx) {

        // Collect tasks for this server
        std::vector<int> tasks_on_server;
        for (size_t task_idx = 0; task_idx < candidate.server_indices.size(); ++task_idx)
            if (candidate.server_indices[task_idx] == (int)server_idx)
                tasks_on_server.push_back(task_idx);

        if (tasks_on_server.empty())
            continue;

        // Compute min and max in one pass
        double min_pr = DBL_MAX;
        double max_pr = DBL_MIN;
        
        for (int t : tasks_on_server) {
            double p = candidate.priorities[t];
            min_pr = std::min(min_pr, p);
            max_pr = std::max(max_pr, p);
        }

        // Insert tasks in the server
        for (int t : tasks_on_server) {
            double p = candidate.priorities[t];
            const Task& task = tasks[t];

            if (utils::areEqual(p,max_pr)) {
                servers[server_idx].pushFrontTask(task);
            }
            else if (utils::areEqual(p,min_pr)) {
                servers[server_idx].pushBackTask(task);
            }
            else {
                // Middle priority → default behavior
                servers[server_idx].pushBackTask(task);
            }
        }
    }
}

void DigitalTwin::printText() const {
    std::cout << "Digital Twin Information:\n";
    
    std::cout << "Tasks (" << tasks.size() << "):\n";
    for (const auto& task : tasks) {
        task.print();
        std::cout << "---------------------\n";
    }

    std::cout << "\n" << "####################\n";
    std::cout << "Servers (" << servers.size() << "):\n";
    for (const auto& server : servers) {
        server.print();
        std::cout << "---------------------\n";
    }

    std::cout << "\n" << "####################\n";
    std::cout << "Connections (" << connections.size() << "):\n";
    for (const auto& conn : connections) {
        std::cout << "Connection ID: " << conn.id << "\n";
        std::cout << "From Server ID: " << conn.from_server_id << "\n";
        std::cout << "To Server ID: " << conn.to_server_id << "\n";
        std::cout << "Delay: " << conn.delay << "\n";
        std::cout << "Bidirectional: " << (conn.bidirectional ? "Yes" : "No") << "\n";
        std::cout << "---------------------\n";
    }

    std::cout << "\n" << "####################\n";
    std::cout << "Schedule:\n";
    for (const auto& server : servers) {
        std::cout << "Server ID: " << server.getId() << "\n";
        std::cout << "Assigned Tasks: ";
        for (const auto& task : server.getAssignedTasks()) {
            std::cout << task.getId() << " ";
        }
        std::cout << "\n---------------------\n";
    }
}

void DigitalTwin::printJSON() const {
    nlohmann::json j;

    j["tasks"] = nlohmann::json::array();
    for (const auto& task : tasks) {
        nlohmann::json jt;
        jt["id"] = task.getId();
        jt["type"] = (task.getType() == TaskType::Mist) ? "Mist" : "Regular";
        jt["C"] = task.getC();
        jt["T"] = task.getT();
        jt["D"] = task.getD();
        jt["M"] = task.getM();
        jt["a"] = task.getA();
        jt["start_time"] = task.getStartTime();
        jt["finish_time"] = task.getFinishTime();
        jt["predecessors"] = task.getPredecessors();
        j["tasks"].push_back(jt);
    }

    j["servers"] = nlohmann::json::array();
    for (const auto& server : servers) {
        nlohmann::json js;
        js["id"] = server.getId();
        js["type"] = (server.getType() == ServerType::Mist) ? "Mist" :
                     (server.getType() == ServerType::Edge) ? "Edge" : "Cloud";
        js["memory"] = server.getMemory();
        js["utilization"] = server.getUtilization();
        js["last_slot"] = server.getLastSlot();
        js["assigned_tasks"] = nlohmann::json::array();
        for (const auto& task : server.getAssignedTasks()) {
            js["assigned_tasks"].push_back(task.getId());
        }
        j["servers"].push_back(js);
    }

    j["connections"] = nlohmann::json::array();
    for (const auto& conn : connections) {
        nlohmann::json jc;
        jc["id"] = conn.id;
        jc["from_server_id"] = conn.from_server_id;
        jc["to_server_id"] = conn.to_server_id;
        jc["delay"] = conn.delay;
        jc["bidirectional"] = conn.bidirectional;
        j["connections"].push_back(jc);
    }

    j["schedule"] = nlohmann::json::array();
    for (const auto& server : servers) {
        nlohmann::json js;
        js["server_id"] = server.getId();
        js["assigned_tasks"] = nlohmann::json::array();
        for (const auto& task : server.getAssignedTasks()) {
            js["assigned_tasks"].push_back(task.getId());
        }
        j["schedule"].push_back(js);
    }

    std::cout << j.dump(4) << std::endl; // Pretty print with 4 spaces indent
}

void DigitalTwin::print(utils::PRINT_TYPE format) const {
    if (format == utils::PRINT_TYPE::PLAIN_TEXT) {
        printText();
    } else if (format == utils::PRINT_TYPE::JSON) {
        printJSON();
    } else {
        throw std::runtime_error("Unknown print format");
    }
}