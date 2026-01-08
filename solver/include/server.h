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

    static Server fromJSON(const nlohmann::json& j);
    void print() const;

    inline std::string getId() const { return id; }
    inline int getInternalIdx() const { return internal_idx; }
    inline ServerType getType() const { return type; }
    inline std::string getLabel() const { return label; }
    inline int getMemory() const { return memory; }
    inline double getUtilization() const { return utilization; }
    inline int getLastSlot() const { return last_slot; }
    
    inline const std::deque<Task>& getAssignedTasks() const { return assigned_tasks; }
    inline std::deque<Task>& getAssignedTasks() { return assigned_tasks; }
    inline void clearTasks() { assigned_tasks.clear(); available_utilization = utilization; }

    inline void setInternalIdx(int internal_idx_) { internal_idx = internal_idx_; }

    inline void pushBackTask(const Task& task) { assigned_tasks.push_back(task); available_utilization -= task.getU(); }
    inline void pushFrontTask(const Task& task) { assigned_tasks.push_front(task); available_utilization -= task.getU(); }
    inline double getAvailableUtilization() const { return available_utilization; }

private:
    std::string id;
    int internal_idx; // Internal ID used for scheduling algorithms
    ServerType type;
    std::string label;
    int memory; // Total memory
    double utilization; // 0..1
    double available_utilization; // available utilization
    int last_slot; // Last slot occupied by a task
    std::deque<Task> assigned_tasks;
};

#endif // SERVER_H