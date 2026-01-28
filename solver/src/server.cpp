#include "../include/server.h"

Server::Server( 
        const ServerType type,
        const std::string& label,
        const int memory,
        const int cost,
        const double utilization
    ) {
    this->id = utils::generate_uuid_short();
    this->type = type;
    this->label = label;
    this->memory = memory;
    this->available_memory = memory; // Initially equals total memory
    this->cost = cost;
    this->utilization = utilization;
    this->available_utilization = utilization; // Initially equals total utilization
    this->internal_idx = -1; // Default value (can be configured with setter)
    this->last_slot = 0; // Initial value
};

Server Server::fromJSON(const nlohmann::json& j) {
    Server server;
    
    // Initial values
    server.last_slot = 0;

    server.id = utils::require_type<std::string>(j, "id");
    server.label = utils::require_type<std::string>(j, "label");

    if(j.contains("type")) {
        std::string typeStr = utils::require_type<std::string>(j, "type");
        if (typeStr == "MIST") {
            server.type = ServerType::Mist;
        } else if (typeStr == "EDGE") {
            server.type = ServerType::Edge;
        } else if (typeStr == "CLOUD") {
            server.type = ServerType::Cloud;
        } else {
            utils::throw_runtime_error("Invalid server type: " + typeStr);
        }
    }

    server.memory = utils::require_type<int>(j, "memory");
    server.cost = utils::require_type<int>(j, "cost");
    server.utilization = utils::require_type<double>(j, "u");
    server.available_utilization = server.utilization; // Initially available equals total

    server.internal_idx = -1; // Default value

    return server;
};

void Server::pushBackTask(const Task& task) { 
    assigned_tasks.push_back(task); 
    available_utilization -= task.getU(); 
    available_memory -= task.getM(); 
    last_slot = task.getFinishTime(); 
};

void Server::pushFrontTask(const Task& task) { 
    assigned_tasks.push_front(task); 
    available_utilization -= task.getU(); 
    available_memory -= task.getM();
    last_slot = std::max(last_slot, task.getFinishTime()); 
};

void Server::clearTasks() { 
    assigned_tasks.clear(); 
    available_utilization = utilization;
    available_memory = memory;
};

std::string Server::print() const {
    std::ostringstream oss;

    oss << "Server ID: " << id << "\n";
    oss << "Label: " << label << "\n";
    oss << "Type: ";
    switch (type) {
        case ServerType::Mist:
            oss << "MIST\n";
            break;
        case ServerType::Edge:
            oss << "EDGE\n";
            break;
        case ServerType::Cloud:
            oss << "CLOUD\n";
            break;
    }
    oss << "Memory: " << memory << "\n";
    oss << "Cost: " << cost << "\n";
    oss << "Utilization: " << utilization << "\n";
    oss << "Last Slot: " << last_slot << "\n";
    
    oss << "Assigned Tasks: " << assigned_tasks.size() << "\n";
    for (const auto& task : assigned_tasks) {
        oss << "  - " << task.getLabel() << " (ID: " << task.getId() << ", Start: " << task.getStartTime() << ", Finish: " << task.getFinishTime() << ")\n";
    }

    return oss.str();
};