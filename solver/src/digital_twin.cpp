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

    size_t num_tasks = j.at("tasks").size();
    tasks.reserve(num_tasks);
    int task_index = 0;
    for (const auto& jt : j.at("tasks")) {
        Task task = Task::fromJSON(jt);
        task.internal_id = task_index;
        task_index++;
        tasks.push_back(task);
    }

    // Compute predecessors from precedences
    if (j.contains("precedences") && j.at("precedences").is_array()) {
        for (const auto& jp : j.at("precedences")) {
            std::string from_id = utils::require_type<std::string>(jp, "from");
            std::string to_id = utils::require_type<std::string>(jp, "to");

            // Add predecessor
            auto to_it = std::find_if(tasks.begin(), tasks.end(), [&](const Task& t) {
                return t.getId() == to_id;
            });
            if (to_it != tasks.end()) {
                int predecessor_internal_id = to_it->internal_id;
                to_it->addPredecessor(from_id, predecessor_internal_id);

            } else {
                throw std::runtime_error("Invalid to_id in precedence: " + to_id);
            }
            
            // Add successor 
            auto from_it = std::find_if(tasks.begin(), tasks.end(), [&](const Task& t) {
                return t.getId() == from_id;
            });
            if (from_it != tasks.end()) {
                int successor_internal_id = from_it->internal_id;
                from_it->addSuccessor(to_id, successor_internal_id);
            } else {
                throw std::runtime_error("Invalid from_id in precedence: " + from_id);
            }

        }
    }

    scheduled = false;
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
    int server_index = 0;
    for (const auto& jn : j.at("nodes")) {
        Server server = Server::fromJSON(jn);
        server.internal_id = server_index;
        server_index++;
        servers.push_back(server);
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

    scheduled = false;
}

bool DigitalTwin::schedule(const Candidate& candidate)
{
    // -------------------------------------------------------------
    // STEP 0 — Reset servers
    // -------------------------------------------------------------
    for (auto& server : servers)
        server.clearTasks();
    
    const size_t num_tasks = tasks.size();
    const size_t num_servers = servers.size();
    bool feasible = true;

    // -------------------------------------------------------------
    // STEP 1 — Assign tasks to servers and sort by priority
    // -------------------------------------------------------------
    std::vector<std::vector<int>> tasks_per_server(num_servers);

    for (size_t t = 0; t < num_tasks; ++t) {
        int s = candidate.server_indices[t];
        if (s < 0 || s >= (int)num_servers) {
            utils::dbg << "Invalid server index " << s << " for task " << t << "\n";
            return false;
        }
        tasks_per_server[s].push_back(t);
    }

    // Sort tasks on each server by ascending priority
    for (size_t s = 0; s < num_servers; ++s) {
        auto& vec = tasks_per_server[s];
        std::sort(vec.begin(), vec.end(),
            [&](int a, int b) {
                return candidate.priorities[a] < candidate.priorities[b];
            });
        // Push the sorted tasks
        for (int t : vec)
            servers[s].pushBackTask(tasks[t]);
    }

    // -------------------------------------------------------------
    // STEP 2 — Build fast lookup using internal_id of tasks
    // -------------------------------------------------------------
    // Maps internal_id -> pointer to task IN THE SERVER's deque
    std::vector<Task*> id_to_task(num_tasks, nullptr);
    std::vector<size_t> id_to_server(num_tasks, 0);

    for (size_t s = 0; s < servers.size(); ++s) {
        auto& assigned = servers[s].getAssignedTasks();
        for (Task& task : assigned) {
            int internal_id = task.internal_id;
            if (internal_id >= 0 && internal_id < (int)num_tasks) {
                id_to_task[internal_id] = &task;
                id_to_server[internal_id] = s;
            }
        }
    }

    // -------------------------------------------------------------
    // STEP 3 — Compute start and finish times (non-preemptive)
    // -------------------------------------------------------------
    bool updated = true;
    while (updated) {
        updated = false;
        for (size_t s = 0; s < num_servers; ++s) {
            int current_time = 0;
            for (Task& task : servers[s].getAssignedTasks()) {
                int earliest_start = current_time; // Based on server availability

                // Check predecessors
                for (size_t i = 0; i < task.getPredecessors().size(); ++i) {
                    int pred_internal_id = task.getPredecessorInternalIds()[i];
                    if (pred_internal_id < 0 || pred_internal_id >= (int)num_tasks ||
                        id_to_task[pred_internal_id] == nullptr) {
                        utils::dbg << "Predecessor task internal_id " << pred_internal_id 
                                   << " not found for task " << task.getId() << "\n";
                        feasible = false;
                        continue;
                    }
                    Task* pred_task = id_to_task[pred_internal_id];
                    size_t pred_server_index = id_to_server[pred_internal_id];
                    
                    int pred_finish = pred_task->getFinishTime();
                    
                    int comm_delay = delay_matrix[pred_server_index][s];
                    int ready_time = pred_finish + comm_delay;
                    
                    if (ready_time > earliest_start) {
                        earliest_start = ready_time;
                    }
                }

                if (task.getStartTime() != earliest_start) {
                    task.setStartTime(earliest_start);
                    updated = true;
                }

                current_time = task.getFinishTime();
            }
        }
    }

    // -------------------------------------------------------------
    // STEP 4 — Check constraints: memory, utilization, deadlines
    // -------------------------------------------------------------
    for (size_t s = 0; s < num_servers; ++s) {

        const auto& assigned = servers[s].getAssignedTasks();

        int total_memory = 0;
        double total_util = 0.0;

        for (const Task& task : assigned) {

            total_memory += task.getM();
            total_util   += task.getU();

            // deadline feasibility
            if (task.getFinishTime() > task.getD()){
                feasible = false;
            }
        }

        if (total_memory > servers[s].getMemory()){
            utils::dbg << "Memory exceeded on server " << servers[s].getId() << ": "
                       << total_memory << " > " << servers[s].getMemory() << "\n";
            feasible = false;
        }

        if (total_util > servers[s].getUtilization()){
            utils::dbg << "Utilization exceeded on server " << servers[s].getId() << ": "
                       << total_util << " > 1.0\n";
            feasible = false;
        }

        if (!feasible){
            utils::dbg << "Constraints violated on server " << servers[s].getId() << "\n";
            break;
        }
    }

    scheduled = feasible;
    return feasible;
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
    std::cout << "Delay Matrix:\n";
    // Print column headers
    std::cout << std::setw(12) << " ";  // Space for row headers
    for (size_t j = 0; j < servers.size(); ++j) {
        //std::cout << std::setw(8) << servers[j].getId().substr(0,4);
        std::cout << std::setw(8) << servers[j].getLabel();
    }
    std::cout << "\n";
    // Print matrix with row headers
    for (size_t i = 0; i < delay_matrix.size(); ++i) {
        //std::cout << std::setw(12) << servers[i].getId().substr(0,4);  // Row header
        std::cout << std::setw(12) << servers[i].getLabel();  // Row header
        for (size_t j = 0; j < delay_matrix[i].size(); ++j) {
            if (delay_matrix[i][j] == INT_MAX) {
                std::cout << std::setw(8) << "INF";
            } else {
                std::cout << std::setw(8) << delay_matrix[i][j];
            }
        }
        std::cout << "\n";
    }

    if(scheduled){
        std::cout << "\n" << "####################\n";
        std::cout << "Tasks allocation:\n";
        for (const auto& server : servers) {
            std::cout << "Server: " << server.getLabel() << " (" << server.getId() << ")\n";
            std::cout << "Assigned Tasks: ";
            for (const auto& task : server.getAssignedTasks()) {
                //std::cout << task.getId() << " ";
                std::cout << task.getLabel() << " ";
            }
            std::cout << "\n---------------------\n";
        }
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
        jt["u"] = task.getU();
        jt["start_time"] = task.getStartTime();
        jt["finish_time"] = task.getFinishTime();
        jt["predecessors"] = task.getPredecessors();
        j["tasks"].push_back(jt);
    }

    j["servers"] = nlohmann::json::array();
    for (const auto& server : servers) {
        nlohmann::json js;
        js["id"] = server.getId();
        js["label"] = server.getLabel();
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

    // Delay matrix with server IDs as labels
    j["delay_matrix"] = nlohmann::json::object();
    j["delay_matrix"]["server_ids"] = nlohmann::json::array();
    for (const auto& server : servers) {
        j["delay_matrix"]["server_ids"].push_back(server.getId().substr(0,4)); // Shortened ID for readability
    }
    j["delay_matrix"]["matrix"] = nlohmann::json::array();
    for (const auto& row : delay_matrix) {
        nlohmann::json jr = nlohmann::json::array();
        for (const auto& val : row) {
            if (val == INT_MAX) {
                jr.push_back("INF");
            } else {
                jr.push_back(val);
            }
        }
        j["delay_matrix"]["matrix"].push_back(jr);
    }   

    if(scheduled){
        j["task_allocation"] = nlohmann::json::array();
        for (const auto& server : servers) {
            nlohmann::json js;
            js["server_id"] = server.getId();
            js["assigned_tasks"] = nlohmann::json::array();
            for (const auto& task : server.getAssignedTasks()) {
                js["assigned_tasks"].push_back(task.getId());
            }
            j["task_allocation"].push_back(js);
        }
    }

    std::cout << j.dump(4) << std::endl; // Pretty print with 4 spaces indent
}

void DigitalTwin::exportScheduleToCSV() const {
    if (!scheduled) {
        throw std::runtime_error("Schedule not computed yet. Cannot export.");
    }

    std::cout << "task,server,start,finish\n";

    for (const auto& server : servers) {
        const auto& tasks = server.getAssignedTasks();
        for (const auto& task : tasks) {
            std::cout << task.getLabel() << ","
                << server.getLabel() << ","
                << task.getStartTime() << ","
                << task.getFinishTime() << "\n";
        }
    }
}

void DigitalTwin::print(utils::PRINT_TYPE format) const {
    switch(format) {
        case utils::PRINT_TYPE::PLAIN_TEXT:
            printText();
            break;
        case utils::PRINT_TYPE::JSON: 
            printJSON();
            break;
        case utils::PRINT_TYPE::SCHEDULE_CSV:
            exportScheduleToCSV();
            break;
        default: 
            throw std::runtime_error("Unknown print format");
    }
}