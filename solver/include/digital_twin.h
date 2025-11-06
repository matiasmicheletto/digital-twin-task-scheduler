#ifndef DIGITAL_TWIN_H
#define DIGITAL_TWIN_H

#include <vector>
#include <string>
#include "json.hpp"
#include "task.h"
#include "server.h"

struct Connection {
    std::string id;
    std::string from_server_id;
    std::string to_server_id;
    int from_server_index;
    int to_server_index;
    int delay;
    bool bidirectional;
};

class DigitalTwin {
    public:
        DigitalTwin(std::string tasks_file, std::string network_file);
        
        inline int getDelay(int from_server_index, int to_server_index) const {
            return delay_matrix[from_server_index][to_server_index];
        }
        
        void print() const;

    private:
        std::vector<Task> tasks;
        std::vector<Server> servers;
        std::vector<Connection> connections;
        std::vector<std::vector<int>> delay_matrix;

        void loadTasksFromJSONFile(const std::string& file_path);
        void loadNetworkFromJSONFile(const std::string& file_path);
        void computeDelayMatrix();
};

#endif // DIGITAL_TWIN_H