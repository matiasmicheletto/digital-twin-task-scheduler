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

    std::string getId() const { return id; }
    ServerType getType() const { return type; }
    std::string getLabel() const { return label; }
    int getMemory() const { return memory; }
    int getUtilization() const { return utilization; }
    int getLastSlot() const { return last_slot; }
    
    const std::deque<Task>& getAssignedTasks() const { return assigned_tasks; }
    std::deque<Task>& getAssignedTasks() { return assigned_tasks; }
    inline void clearTasks() { assigned_tasks.clear(); }

    inline void pushBackTask(const Task& task) { assigned_tasks.push_back(task); }
    inline void pushFrontTask(const Task& task) { assigned_tasks.push_front(task); }

private:
    std::string id;
    ServerType type;
    std::string label;
    int memory; // Total memory
    int utilization; // 0-1
    int last_slot; // Last slot occupied by a task
    std::deque<Task> assigned_tasks;
};

#endif // SERVER_H