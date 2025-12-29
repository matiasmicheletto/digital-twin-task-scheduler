#ifndef SCHEDULER_H
#define SCHEDULER_H

#include <vector>
#include <queue>
#include <string>
#include <iomanip>
#include <algorithm>
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
    Candidate(size_t task_count) {
        server_indices.resize(task_count, -1);
        priorities.resize(task_count, 0.0);
    }
};

class Scheduler {
    public:
        Scheduler(std::string tasks_file, std::string network_file);
        
        bool schedule(const Candidate& candidate);
        inline bool isScheduled() const { return scheduled; }

        inline size_t getTaskCount() const { return tasks.size(); }
        inline size_t getServerCount() const { return servers.size(); }

        inline const Task& getTask(size_t index) const { return tasks.at(index); }
        inline const Server& getServer(size_t index) const { return servers.at(index); }

        int getScheduleSpan() const;

        int getFinishTimeSum() const;
        
        void print(utils::PRINT_TYPE format = utils::PRINT_TYPE::PLAIN_TEXT) const;
        void exportScheduleToCSV() const;

    private:
        std::vector<Task> tasks;
        std::vector<Server> servers;
        std::vector<Connection> connections;
        std::vector<std::vector<int>> delay_matrix;

        bool scheduled;

        void loadTasksFromJSONFile(const std::string& file_path);
        void loadNetworkFromJSONFile(const std::string& file_path);
        void computeDelayMatrix();

        void printText() const;
        void printJSON() const;
};

#endif // SCHEDULER_H