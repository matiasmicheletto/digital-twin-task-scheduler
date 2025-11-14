#include "../include/task.h"

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
    task.u = static_cast<double>(task.C) / static_cast<double>(task.T);
    
    // Handle processorId that can be string or null
    if (j.contains("processorId") && !j["processorId"].is_null()) {
        task.fixedAllocationId = utils::require_type<std::string>(j, "processorId");
        task.fixedAllocation = true;
        task.fixedAllocationInternalId = -1;
    } else {
        task.fixedAllocationId = ""; // or some default value indicating unallocated
        task.fixedAllocation = false;
        task.fixedAllocationInternalId = -1;
    }

    if(j.contains("successors"))
        task.successors = utils::require_type<std::vector<std::string>>(j, "successors");

    task.start_time = 0;
    task.finish_time = task.start_time + task.C;

    // Following attributes will be set by Scheduler during tasks system loading
    task.internal_id = -1;
    task.successors.clear();
    task.predecessors.clear();
    task.successor_internal_ids.clear();
    task.predecessor_internal_ids.clear();

    return task;
}

void Task::print() const {
    std::cout << "Task ID: " << id << "\n";
    std::cout << "Label: " << label << "\n";
    std::cout << "Type: " << (type == TaskType::Mist ? "MIST" : "REGULAR") << "\n";
    std::cout << "Computation time (C): " << C << "\n";
    std::cout << "Activation time (a): " << a << "\n";
    std::cout << "Period (T): " << T << "\n";
    std::cout << "Deadline (D): " << D << "\n";
    std::cout << "Memory requirement (M): " << M << "\n";
    std::cout << "Utilization (u): " << u << "\n";
    
    bool hasSuccessors = successors.size() > 0;
    std::cout << "Has successors: " << (hasSuccessors ? "Yes" : "No") << "\n";
    if (hasSuccessors) {
        std::cout << "Successors: ";
        for (const auto& succ : successors) {
            std::cout << succ << " ";
        }
        std::cout << "\n";
    }
    std::cout << "Start time: " << start_time << "\n";
    std::cout << "Finish time: " << finish_time << "\n";
}