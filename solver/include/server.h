#ifndef SERVER_H
#define SERVER_H

#include <deque>
#include "json.hpp"
#include "task.h"
#include "utils.h"


enum class ServerType {
    Mist,
    Edge,
    Cloud
};

class Server {
public:
    Server() = default;
    Server( 
        const ServerType type,
        const std::string& label,
        const int memory,
        const int cost,
        const double utilization
    );

    static Server fromJSON(const nlohmann::json& j);
    std::string print() const;

    inline std::string getId() const { return id; }
    inline int getInternalIdx() const { return internal_idx; }
    inline ServerType getType() const { return type; }
    inline std::string getLabel() const { return label; }
    inline int getMemory() const { return memory; }
    inline int getCost() const { return cost; }
    inline double getUtilization() const { return utilization; }
    inline int getLastSlot() const { return last_slot; }
    
    inline const std::deque<Task>& getAssignedTasks() const { return assigned_tasks; }
    inline std::deque<Task>& getAssignedTasks() { return assigned_tasks; }

    inline void setInternalIdx(int internal_idx_) { internal_idx = internal_idx_; }

    void pushBackTask(const Task& task);
    void pushFrontTask(const Task& task);
    void clearTasks();

    inline double getAvailableUtilization() const { return available_utilization; }
    inline int getAvailableMemory() const { return available_memory; }

private:
    std::string id;
    int internal_idx; // Internal ID used for scheduling algorithms
    ServerType type;
    std::string label;
    int memory; // Total memory
    int available_memory; // Available memory for allocating tasks. Initially equals total memory
    int cost; // Cost per use
    double utilization; // 0..1, total utilization.
    double available_utilization; // available utilization for allocating tasks. Initially equals total utilization
    int last_slot; // Last slot occupied by a task
    std::deque<Task> assigned_tasks;
};

#endif // SERVER_H