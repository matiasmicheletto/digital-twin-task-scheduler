#include "../include/server.h"

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
            throw std::invalid_argument("Invalid server type: " + typeStr);
        }
    }

    server.memory = utils::require_type<int>(j, "memory");
    server.utilization = utils::require_type<double>(j, "u");
    server.available_utilization = server.utilization; // Initially available equals total

    server.internal_idx = -1; // Default value

    return server;
}

void Server::print() const {
    std::cout << "Server ID: " << id << "\n";
    std::cout << "Label: " << label << "\n";
    std::cout << "Type: ";
    switch (type) {
        case ServerType::Mist:
            std::cout << "MIST\n";
            break;
        case ServerType::Edge:
            std::cout << "EDGE\n";
            break;
        case ServerType::Cloud:
            std::cout << "CLOUD\n";
            break;
    }
    std::cout << "Memory: " << memory << "\n";
    std::cout << "Utilization: " << utilization << "\n";
    std::cout << "Last Slot: " << last_slot << "\n";
    std::cout << "Assigned Tasks: " << assigned_tasks.size() << "\n";
}