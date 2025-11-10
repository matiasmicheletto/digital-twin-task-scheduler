#ifndef DIGITAL_TWIN_H
#define DIGITAL_TWIN_H

#include <vector>
#include <string>
#include <iomanip>
#include "utils.h"
#include "json.hpp"
#include "task.h"
#include "server.h"

struct Connection { // Used to compute delay matrix
    std::string id;
    std::string from_server_id;
    std::string to_server_id;
    int from_server_index;
    int to_server_index;
    int delay;
    bool bidirectional;
};

struct Candidate { // Structure to compute tasks allocation to servers
    std::vector<int> server_indices; // Server assigned to each task
    std::vector<double> priorities;   // Priority of each task to define order of execution
};

class DigitalTwin {
    public:
        DigitalTwin(std::string tasks_file, std::string network_file);
        
        void schedule(Candidate candidate);

        inline size_t getTaskCount() const { return tasks.size(); }
        inline size_t getServerCount() const { return servers.size(); }
        
        void print(utils::PRINT_TYPE format = utils::PRINT_TYPE::PLAIN_TEXT) const;

    private:
        std::vector<Task> tasks;
        std::vector<Server> servers;
        std::vector<Connection> connections;
        std::vector<std::vector<int>> delay_matrix;

        void loadTasksFromJSONFile(const std::string& file_path);
        void loadNetworkFromJSONFile(const std::string& file_path);
        void computeDelayMatrix();

        void printText() const;
        void printJSON() const;
};

#endif // DIGITAL_TWIN_H