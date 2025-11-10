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

    if(j.contains("successors"))
        task.successors = utils::require_type<std::vector<std::string>>(j, "successors");

    task.hasSuccessors = task.successors.size() > 0;

    task.internal_id = -1; // Default value

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