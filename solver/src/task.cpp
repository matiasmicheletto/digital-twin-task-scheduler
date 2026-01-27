#include "../include/task.h"

Task::Task(
        const TaskType type,
        const std::string label,
        const bool fixedAllocation,
        const int C,
        const int T,
        const int D,
        const int M,
        const int a
    ) {
    this->id = utils::generate_uuid_short();
    this->type = type;
    this->label = label;
    this->fixedAllocation = fixedAllocation;
    this->fixedAllocationId = ""; // Will be set later if fixedAllocation is true
    this->fixedAllocationInternalIdx = -1; // Will be set later when servers are loaded
    this->C = C;
    this->T = T;
    this->D = D;
    this->M = M;
    this->a = a;
    this->u = static_cast<double>(C) / T; // Calculate utilization
    this->internal_idx = -1; // Default value (can be configured with setter)
    this->start_time = 0; // Initial value
    this->finish_time = 0; // Initial value
};

Task Task::fromJSON(const nlohmann::json& j) {

    Task task;

    task.id = utils::require_type<std::string>(j, "id");
    task.label = utils::require_type<std::string>(j, "label");
    bool mist = utils::require_type<bool>(j, "mist");
    task.type = mist ? TaskType::Mist : TaskType::Regular;
    task.C = utils::require_type<int>(j, "C");
    task.T = utils::require_type<int>(j, "T");
    task.D = utils::require_type<int>(j, "D");
    task.M = utils::require_type<int>(j, "M");
    task.a = utils::require_type<int>(j, "a");
    
    // Calculate utilization, avoid division by zero
    if (task.T <= 0) {
        utils::throw_runtime_error("Task " + task.id + " has invalid period T: " + std::to_string(task.T) + " (must be > 0)");
    }
    task.u = static_cast<double>(task.C) / static_cast<double>(task.T);

    // Handle processorId that can be string or null
    task.fixedAllocation = j.contains("processorId") && !j["processorId"].is_null();
    task.fixedAllocationInternalIdx = -1; // Will be set later when servers are loaded
    if (task.fixedAllocation) {
        task.fixedAllocationId = utils::require_type<std::string>(j, "processorId");
    } else {
        task.fixedAllocationId = ""; // or some default value indicating unallocated
    }

    task.successors.clear();    
    if(j.contains("successors"))
        task.successors = utils::require_type<std::vector<std::string>>(j, "successors");

    task.start_time = 0;
    task.finish_time = task.start_time + task.C;

    // Following attributes will be set by Scheduler during tasks system loading
    task.internal_idx = -1;
    task.predecessors.clear();
    task.successor_internal_idxs.clear();
    task.predecessor_internal_idxs.clear();

    return task;
}

std::string Task::print() const {
    std::ostringstream oss;

    oss << "Task ID: " << id << "\n";
    oss << "Label: " << label << "\n";
    oss << "Type: " << (type == TaskType::Mist ? "MIST" : "REGULAR") << "\n";
    oss << "Computation time (C): " << C << "\n";
    oss << "Activation time (a): " << a << "\n";
    oss << "Period (T): " << T << "\n";
    oss << "Deadline (D): " << D << "\n";
    oss << "Memory requirement (M): " << M << "\n";
    oss << "Utilization (u): " << u << "\n";
    
    bool hasSuccessors = successors.size() > 0;
    if (hasSuccessors) {
        oss << "Successors: ";
        for (const auto& succ : successors) {
            oss << succ << " ";
        }
        oss << "\n";
    }else{
        oss << "No successors.\n";
    }

    bool hasPredecessors = predecessors.size() > 0;
    if (hasPredecessors) {
        oss << "Predecessors: ";
        for (const auto& pred : predecessors) {
            oss << pred << " ";
        }
        oss << "\n";
    }else{
        oss << "No predecessors.\n";
    }
    oss << "Start time: " << start_time << "\n";
    oss << "Finish time: " << finish_time << "\n";

    if (fixedAllocation) {
        oss << "Fixed Allocation: Yes, to " << fixedAllocationId << "\n";
    } else {
        oss << "Fixed Allocation: No\n";
    }

    return oss.str();
}