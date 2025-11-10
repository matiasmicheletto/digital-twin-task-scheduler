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
        
        int internal_id; // Internal ID used for scheduling algorithms

        int getC() const { return C; }
        int getT() const { return T; }
        int getD() const { return D; }
        int getM() const { return M; }
        int getA() const { return a; }
        int getU() const { return u; }
        int getStartTime() const { return start_time; }
        int getFinishTime() const { return finish_time; }
        
        bool getHasSuccessors() const { return hasSuccessors; }
        
        inline void addPredecessor(const std::string& pred_id) { predecessors.push_back(pred_id); }        
        inline const std::vector<std::string>& getPredecessors() const { return predecessors; }
        inline const std::vector<int>& getPredecessorInternalIds() const { return predecessor_internal_ids; }
        
        inline void addSuccessor(const std::string& succ_id) { successors.push_back(succ_id); hasSuccessors = true; }
        inline const std::vector<std::string>& getSuccessors() const { return successors; }
        inline const std::vector<int>& getSuccessorInternalIds() const { return successor_internal_ids; }

    private:
        // Properties
        std::string id;
        TaskType type;
        std::string label;
        
        // Inmutable time variables measured in time slots
        int C; // Computation time
        int T; // Period
        int D; // Deadline
        int a; // Activation time
        int start_time = 0; // Start time
        int finish_time = 0; // Finish time

        // Resource requirements
        int M; // Memory
        double u; // Utilization factor is computed as u = C/T
        
        bool hasSuccessors = false; // Fast check for successors
        std::vector<std::string> successors; // IDs of successor tasks
        std::vector<std::string> predecessors; // IDs of predecessor tasks
        std::vector<int> successor_internal_ids; // Internal IDs of successor tasks
        std::vector<int> predecessor_internal_ids; // Internal IDs of predecessor tasks
};

#endif // TASK_H