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

        int internal_id; // Internal ID used for scheduling algorithms

        // Setters
        inline void setStartTime(int start) { start_time = start; finish_time = start_time + C; }
        inline void addPredecessor(const std::string& pred_id, const int predecessor_internal_id = 0) { 
            predecessors.push_back(pred_id); 
            predecessor_internal_ids.push_back(predecessor_internal_id); 
        }
        inline void addSuccessor(const std::string& succ_id, const int successor_internal_id = 0) { 
            successors.push_back(succ_id); 
            successor_internal_ids.push_back(successor_internal_id);
        }

        // Getters
        inline std::string getId() const { return id; }
        inline std::string getLabel() const { return label; }
        inline TaskType getType() const { return type; }
        inline bool isAllocated() const { return !allocatedTo.empty(); }

        inline int getC() const { return C; }
        inline int getT() const { return T; }
        inline int getD() const { return D; }
        inline int getM() const { return M; }
        inline int getA() const { return a; }
        inline double getU() const { return u; }
        inline int getStartTime() const { return start_time; }
        inline int getFinishTime() const { return finish_time; }
        
        inline const std::vector<std::string>& getPredecessors() const { return predecessors; }
        inline const std::vector<int>& getPredecessorInternalIds() const { return predecessor_internal_ids; }
        
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
        int start_time; // Start time
        int finish_time; // Finish time
        std::string allocatedTo; // ID of the server to which the task is allocated

        // Resource requirements
        int M; // Memory
        double u; // Utilization factor is computed as u = C/T
        
        std::vector<std::string> successors; // IDs of successor tasks
        std::vector<std::string> predecessors; // IDs of predecessor tasks
        std::vector<int> successor_internal_ids; // Internal IDs of successor tasks
        std::vector<int> predecessor_internal_ids; // Internal IDs of predecessor tasks
};

#endif // TASK_H