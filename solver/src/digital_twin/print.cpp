#include "digital_twin.h"

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