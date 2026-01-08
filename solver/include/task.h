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
        Task(const Task&) = default;
        Task(
            const std::string& id_,
            TaskType type_,
            const std::string& label_,
            int internal_idx_,
            bool fixedAllocation_,
            const std::string& fixedAllocationId_,
            int C_,
            int T_,
            int D_,
            int M_,
            int a_)
            : 
            id(id_),
            type(type_),
            label(label_),
            internal_idx(internal_idx_),
            fixedAllocation(fixedAllocation_),
            fixedAllocationId(fixedAllocationId_),
            fixedAllocationInternalIdx(-1),
            C(C_),
            T(T_),
            D(D_),
            a(a_),
            start_time(0),
            finish_time(0),
            M(M_),
            u(static_cast<double>(C_) / T_) 
        {}
        ~Task() = default;

        static Task fromJSON(const nlohmann::json& j);
        void print() const;

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

        inline void setC(int c) { C = c; }
        inline void setT(int t) { T = t; }
        inline void setD(int d) { D = d; }
        inline void setM(int m) { M = m; }
        inline void setU(double utilization) { u = utilization; }
        inline void setInternalIdx(int internal_idx_) { internal_idx = internal_idx_; }
        inline void setFixedAllocationInternalId(int fixed_allocation_internal_idx_) { fixedAllocationInternalIdx = fixed_allocation_internal_idx_; }
        inline void setStart_time(int start) { start_time = start; }
        inline void setFinish_time(int finish) { finish_time = finish; }
        
        inline const std::vector<std::string>& getPredecessors() const { return predecessors; }
        inline const std::vector<int>& getPredecessorInternalIdxs() const { return predecessor_internal_idxs; }
        
        inline const std::vector<std::string>& getSuccessors() const { return successors; }
        inline const std::vector<int>& getSuccessorInternalIdxs() const { return successor_internal_idxs; }

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