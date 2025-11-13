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

    int internal_id; // Internal ID used for scheduling algorithms

    inline std::string getId() const { return id; }
    inline ServerType getType() const { return type; }
    inline std::string getLabel() const { return label; }
    inline int getMemory() const { return memory; }
    inline double getUtilization() const { return utilization; }
    inline int getLastSlot() const { return last_slot; }
    
    inline const std::deque<Task>& getAssignedTasks() const { return assigned_tasks; }
    inline std::deque<Task>& getAssignedTasks() { return assigned_tasks; }
    inline void clearTasks() { assigned_tasks.clear(); }

    inline void pushBackTask(const Task& task) { assigned_tasks.push_back(task); }
    inline void pushFrontTask(const Task& task) { assigned_tasks.push_front(task); }

private:
    std::string id;
    ServerType type;
    std::string label;
    int memory; // Total memory
    double utilization; // 0-1
    int last_slot; // Last slot occupied by a task
    std::deque<Task> assigned_tasks;
};

#endif // SERVER_H