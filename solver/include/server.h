#ifndef SERVER_H
#define SERVER_H

#include <vector>
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

    std::string getId() const { return id; }
    ServerType getType() const { return type; }
    int getMemory() const { return memory; }
    int getUtilization() const { return utilization; }
    int getLastSlot() const { return last_slot; }
    const std::vector<Task>& getAssignedTasks() const { return assigned_tasks; }

    void assignTask(const Task& task) {
        assigned_tasks.push_back(task);
        // Update last_slot or other server parameters as needed
    }

private:
    std::string id;
    ServerType type;
    int memory; // Total memory
    int utilization; // 0-1
    int last_slot;
    std::vector<Task> assigned_tasks;
};

#endif // SERVER_H