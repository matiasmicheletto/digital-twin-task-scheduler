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
        server_indices.resize(task_count, -1); // -1 means unassigned
        priorities.resize(task_count, 0.0);
    }
    std::string print() const;

    bool operator==(const Candidate& other) const {
        return server_indices == other.server_indices && priorities == other.priorities;
    }

    bool operator!=(const Candidate& other) const {
        return !(*this == other);
    }
};

struct ScheduleState {
public:
    enum State {
        SCHEDULED, // success
        NOT_SCHEDULED, // not yet scheduled
        CANDIDATE_ERROR, // invalid candidate
        PRECEDENCES_ERROR, // invalid precedences
        SUCCESSORS_ERROR, // invalid successors
        CYCLE_ERROR, // cycle detected in task graph
        DEADLINE_MISSED, // task misses deadline
        UTILIZATION_UNFEASIBLE, // server over-utilized
        MEMORY_UNFEASIBLE, // server out of memory
    } schedule_state;

    ScheduleState(State state = NOT_SCHEDULED) : schedule_state(state) {}

    std::string toString() const;
    
    bool operator==(const ScheduleState& other) const {
        return schedule_state == other.schedule_state;
    }

    bool operator!=(const ScheduleState& other) const {
        return schedule_state != other.schedule_state;
    }
};

class Scheduler {
    public:
        Scheduler(std::string tasks_file, std::string network_file);
        
        ScheduleState schedule(const Candidate& candidate);
        inline ScheduleState getScheduleState() const { return state; }

        std::string getInstanceName() const { return instance_name; }

        inline size_t getTaskCount() const { return tasks.size(); }
        inline size_t getServerCount() const { return servers.size(); }
        inline size_t getNonMISTServerCount() const { return non_mist_servers_idxs.size(); }

        inline const Task& getTask(size_t index) const { return tasks.at(index); }
        inline const Server& getServer(size_t index) const { return servers.at(index); }
        inline const int getNonMISTServerIdx(size_t index) const { return non_mist_servers_idxs.at(index); }

        int getScheduleSpan() const;

        int getFinishTimeSum() const;

        int getProcessorsCost() const;

        int getDelayCost() const;
        
        void clearAllServerTasks();
        
        std::string print(utils::PRINT_FORMAT format = utils::PRINT_FORMAT::TXT) const;

    private:
        std::vector<Task> tasks;
        std::vector<Server> servers;
        std::vector<int> non_mist_servers_idxs; // List of non-MIST servers (the MIST ones cannot host more than one task)
        std::vector<Connection> connections; // Connections are duplicated for bidirectional links
        std::vector<std::vector<int>> delay_matrix;
        std::string instance_name;

        ScheduleState state;

        void loadTasksFromJSONFile(const std::string& file_path);
        void loadNetworkFromJSONFile(const std::string& file_path);
        void computeDelayMatrix();

        std::string printTxt() const;
        std::string printJSON() const;
        std::string printCSV() const;
};

#endif // SCHEDULER_H