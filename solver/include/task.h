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
        Task(int internal_id_,
            const std::string& id_,
            TaskType type_,
            const std::string& label_,
            bool fixedAllocation_,
            const std::string& fixedAllocationId_,
            int C_,
            int T_,
            int D_,
            int M_,
            int a_)
            : internal_id(internal_id_),
            id(id_),
            type(type_),
            label(label_),
            fixedAllocation(fixedAllocation_),
            fixedAllocationId(fixedAllocationId_),
            C(C_),
            T(T_),
            D(D_),
            a(a_),          // Moved 'a' up to match class declaration
            start_time(0),
            finish_time(0),
            M(M_),          // Moved 'M' down to match class declaration
            u(static_cast<double>(C_) / T_) 
        {}
        ~Task() = default;

        static Task fromJSON(const nlohmann::json& j);
        void print() const;

        int internal_id; // Internal ID used for scheduling algorithms
        int fixedAllocationInternalId; // Internal ID of the server to which the task is allocated

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
        inline void setStart_time(int start) { start_time = start; }
        inline void setFinish_time(int finish) { finish_time = finish; }
        
        inline const std::vector<std::string>& getPredecessors() const { return predecessors; }
        inline const std::vector<int>& getPredecessorInternalIds() const { return predecessor_internal_ids; }
        
        inline const std::vector<std::string>& getSuccessors() const { return successors; }
        inline const std::vector<int>& getSuccessorInternalIds() const { return successor_internal_ids; }

    private:
        // Properties
        std::string id;
        TaskType type;
        std::string label;

        bool fixedAllocation; // Whether the task has a fixed allocation
        std::string fixedAllocationId; // ID of the server to which the task is allocated
        
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
        std::vector<int> successor_internal_ids; // Internal IDs of successor tasks
        std::vector<int> predecessor_internal_ids; // Internal IDs of predecessor tasks
};

#endif // TASK_H