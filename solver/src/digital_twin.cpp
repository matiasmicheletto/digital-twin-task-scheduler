#include "../include/digital_twin.h"

DigitalTwin::DigitalTwin(std::string tasks_file, std::string network_file) {
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

void DigitalTwin::print() const {
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
}