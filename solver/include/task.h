#ifndef TASK_H
#define TASK_H

#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include "json.hpp"
#include "utils.h"

enum class TaskType {
    Mist,
    Regular
};

class Task {
    public:
        Task() = default;

        static Task fromJSON(const nlohmann::json& j);
        void print() const;

        // Setters
        void setStartTime(int start) { start_time = start; }
        void setFinishTime(int finish) { finish_time = finish; }

        // Getters
        std::string getId() const { return id; }
        std::string getLabel() const { return label; }
        TaskType getType() const { return type; }
        int getC() const { return C; }
        int getT() const { return T; }
        int getD() const { return D; }
        int getM() const { return M; }
        int getA() const { return a; }
        int getStartTime() const { return start_time; }
        int getFinishTime() const { return finish_time; }
        
        bool getHasSuccessors() const { return hasSuccessors; }
        
        void addPredecessor(const std::string& pred_id) { predecessors.push_back(pred_id); }
        const std::vector<std::string>& getPredecessors() const { return predecessors; }

    private:
        std::string id;
        TaskType type;
        std::string label;
        int C; // Computation time
        int T; // Period
        int D; // Deadline
        int M; // Memory requirement
        int a; // Activation time
        bool hasSuccessors = false; // Fast check for successors
        std::vector<std::string> successors; // IDs of successor tasks
        std::vector<std::string> predecessors; // IDs of predecessor tasks
        int start_time = 0; // Start time
        int finish_time = 0; // Finish time
};

#endif // TASK_H