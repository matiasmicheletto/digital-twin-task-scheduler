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

        Task(
            const TaskType type,
            const std::string label,
            const bool fixedAllocation,
            const int C,
            const int T,
            const int D,
            const int M,
            const int a
        );

        ~Task() = default;

        static Task fromJSON(const nlohmann::json& j);
        std::string print() const;

        // Getters
        inline std::string getId() const { return id; }
        inline int getInternalIdx() const { return internal_idx; }
        inline int getFixedAllocationInternalIdx() const { return fixedAllocationInternalIdx; }
        inline std::string getLabel() const { return label; }
        inline TaskType getType() const { return type; }
        inline bool hasFixedAllocation() const { return fixedAllocation; }
        inline std::string getFixedAllocationTo() const { return fixedAllocationId; }
        inline int getC() const { return C; }
        inline int getT() const { return T; }
        inline int getD() const { return D; }
        inline int getM() const { return M; }
        inline int getA() const { return a; }
        inline double getU() const { return u; }
        inline int getStartTime() const { return start_time; }
        inline int getFinishTime() const { return finish_time; }
        inline const std::vector<std::string>& getPredecessors() const { return predecessors; }
        inline const std::vector<int>& getPredecessorInternalIdxs() const { return predecessor_internal_idxs; }
        inline const std::vector<std::string>& getSuccessors() const { return successors; }
        inline const std::vector<int>& getSuccessorInternalIdxs() const { return successor_internal_idxs; }

        // Setters
        inline void setStartTime(int start) { start_time = start; finish_time = start_time + C; }
        inline void addPredecessor(const std::string& pred_id, const int predecessor_internal_id = 0) { 
            predecessors.push_back(pred_id); 
            predecessor_internal_idxs.push_back(predecessor_internal_id); 
        }
        inline void addSuccessor(const std::string& succ_id, const int successor_internal_idx = 0) { 
            successors.push_back(succ_id); 
            successor_internal_idxs.push_back(successor_internal_idx);
        }
        inline void setC(int c) { C = c; }
        inline void setT(int t) { T = t; }
        inline void setD(int d) { D = d; }
        inline void setM(int m) { M = m; }
        inline void setU(double utilization) { u = utilization; }
        inline void setId(const std::string& id_) { id = id_; }
        inline void setInternalIdx(int internal_idx_) { internal_idx = internal_idx_; }
        inline void setFixedAllocationId(const std::string& fixed_allocation_id_) { fixedAllocationId = fixed_allocation_id_; fixedAllocation=true; }
        inline void setFixedAllocationInternalId(int fixed_allocation_internal_idx_) { fixedAllocationInternalIdx = fixed_allocation_internal_idx_; }

    private:
        // Properties
        std::string id;
        TaskType type;
        std::string label;
        int internal_idx; // Internal ID used for scheduling algorithms
        
        bool fixedAllocation; // Whether the task has a fixed allocation
        std::string fixedAllocationId; // ID of the server to which the task is allocated
        int fixedAllocationInternalIdx; // Internal ID of the server to which the task is allocated
        
        // Inmutable time variables measured in time slots
        int C; // Computation time
        int T; // Period
        int D; // Deadline
        int a; // Activation time
        int start_time; // Start time
        int finish_time; // Finish time

        // Resource requirements
        int M; // Memory
        double u; // Utilization factor is computed as u = C/T
        
        std::vector<std::string> successors; // IDs of successor tasks
        std::vector<std::string> predecessors; // IDs of predecessor tasks
        std::vector<int> successor_internal_idxs; // Internal IDs of successor tasks
        std::vector<int> predecessor_internal_idxs; // Internal IDs of predecessor tasks
};

#endif // TASK_H