#include "scheduler.h"


std::string Candidate::print() const {
    std::ostringstream oss; // Server indices count from 0 (this is not server ID)
    for (size_t i = 0; i < server_indices.size(); ++i) {
        oss << "  Task " << i << ": Server " << server_indices[i] << ", Priority " << std::fixed << std::setprecision(4) << priorities[i] << "\n";
    }
    return oss.str();
};

std::string ScheduleState::toString() const {
    switch (schedule_state) {
        case NOT_SCHEDULED: return "Not scheduled";
        case SCHEDULED: return "Scheduled successfully";
        case CANDIDATE_ERROR: return "Candidate error: invalid task-server assignments or priorities";
        case PRECEDENCES_ERROR: return "Precedences error: invalid predecessor references or disconnected servers";
        case SUCCESSORS_ERROR: return "Successors error: invalid successor references";
        case CYCLE_ERROR: return "Cycle error: cycle detected in task graph";
        case DEADLINE_MISSED: return "Deadline missed: one or more tasks miss their deadlines";
        case UTILIZATION_UNFEASIBLE: return "Utilization unfeasible: one or more servers over-utilized";
        case MEMORY_UNFEASIBLE: return "Memory unfeasible: one or more servers out of memory";
        default: return "Unknown schedule state";
    }
};

std::string Scheduler::printTxt() const {

    std::ostringstream oss;

    oss << "Scheduler Information:\n\n";
    
    oss << "Tasks (" << tasks.size() << "):\n\n";
    for (const auto& task : tasks) {
        oss << task.print();
        oss << "---------------------\n";
    }

    oss << "\n" << "####################\n";
    oss << "Servers (" << servers.size() << "):\n\n";
    for (const auto& server : servers) {
        oss << server.print();
        oss << "---------------------\n";
    }

    oss << "\n" << "####################\n";
    oss << "Connections (" << connections.size() << "):\n";
    for (const auto& conn : connections) {
        std::string fromServerLabel = "";
        std::string toServerLabel = "";
        for (const auto& server : servers) {
            if (server.getId() == conn.from_server_id) {
                fromServerLabel = server.getLabel();
            }
            if (server.getId() == conn.to_server_id) {
                toServerLabel = server.getLabel();
            }
        }
        oss << "Connection ID: " << conn.id << "\n";
        oss << "From Server ID: " << conn.from_server_id << " (" << fromServerLabel << ")\n";
        oss << "To Server ID: " << conn.to_server_id << " (" << toServerLabel << ")\n";
        oss << "Delay: " << conn.delay << "\n";
        oss << "Bidirectional: " << (conn.bidirectional ? "Yes" : "No") << "\n";
        oss << "---------------------\n";
    }

    oss << "\n" << "####################\n";
    oss << "Delay Matrix:\n";
    // Print column headers
    oss << std::setw(12) << " ";  // Space for row headers
    for (size_t j = 0; j < servers.size(); ++j) {
        //oss << std::setw(8) << servers[j].getId().substr(0,4);
        oss << std::setw(8) << servers[j].getLabel();
    }
    oss << "\n";
    // Print matrix with row headers
    for (size_t i = 0; i < delay_matrix.size(); ++i) {
        //oss << std::setw(12) << servers[i].getId().substr(0,4);  // Row header
        oss << std::setw(12) << servers[i].getLabel();  // Row header
        for (size_t j = 0; j < delay_matrix[i].size(); ++j) {
            if (delay_matrix[i][j] == INT_MAX) {
                oss << std::setw(8) << "INF";
            } else {
                oss << std::setw(8) << delay_matrix[i][j];
            }
        }
        oss << "\n";
    }

    if(state == ScheduleState::SCHEDULED) {
        oss << "\n" << "####################\n";
        oss << "Tasks allocation by server:\n";
        for (const auto& server : servers) {
            oss << "Server: " << server.getLabel() << " (" << server.getId() << ")\n";
            oss << "Assigned Tasks: ";
            for (const auto& task : server.getAssignedTasks()) {
                //oss << task.getId() << " ";
                oss << task.getLabel() << " ";
            }
            oss << "\n---------------------\n";
        }

        oss << "\n" << "####################\n";
        oss << "Tasks allocation by task:\n";
        for (const auto& task : tasks) {
            oss << "Task: " << task.getLabel() << " (" << task.getId() << ")\n";
            // Find server hosting this task
            std::string server_info = "Not allocated";
            for (const auto& server : servers) {
                const auto& assigned_tasks = server.getAssignedTasks();
                auto it = std::find_if(assigned_tasks.begin(), assigned_tasks.end(), [&task](const Task& at){
                    return at.getInternalIdx() == task.getInternalIdx();
                });
                if (it != assigned_tasks.end()) {
                    server_info = server.getLabel() + " (" + server.getId() + ")";
                    break;
                }
            }
            oss << "Assigned Server: " << server_info << "\n";
            oss << "Start Time: " << task.getStartTime() << "\n";
            oss << "Finish Time: " << task.getFinishTime() << "\n";
            oss << "---------------------\n";
        }
    }

    return oss.str();
};

std::string Scheduler::printJSON() const {
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

    return j.dump(4);
}

std::string Scheduler::printTable(char separator) const {

    if (state != ScheduleState::SCHEDULED) {
        utils::throw_runtime_error("Schedule not computed yet. Cannot export.");
    }

    std::ostringstream oss;

    oss << "task,server,start,finish\n";

    for (const auto& server : servers) {
        const auto& tasks = server.getAssignedTasks();
        for (const auto& task : tasks) {
            oss << task.getId() << separator
                << server.getId() << separator
                << task.getStartTime() << separator
                << task.getFinishTime() << "\n";
        }
    }

    return oss.str();
};

std::string Scheduler::print(utils::PRINT_FORMAT format) const {
    switch(format) {
        case utils::PRINT_FORMAT::TXT:
            return printTxt();
            break;
        case utils::PRINT_FORMAT::JSON: 
            return printJSON();
            break;
        case utils::PRINT_FORMAT::CSV:
            return printTable(',');
            break;
        case utils::PRINT_FORMAT::TAB:
            return printTable('\t');
            break;
        default: {
            utils::throw_runtime_error("Unknown print format");
            return "";
        }
    }
};