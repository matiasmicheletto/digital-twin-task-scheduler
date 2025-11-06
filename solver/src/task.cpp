#include "../include/task.h"

std::vector<Task> Task::loadTasksFromJSONFile(const std::string& file_path) {

    std::ifstream file(file_path);
    if (!file.is_open()) {
        throw std::runtime_error("Could not open file: " + file_path);
    }

    nlohmann::json j;
    file >> j;

    // json structure:
    // {
    //   "metadata": { ... },
    //   "tasks": [ ... ],
    //   "precedences": [ ... ]
    // }

    if (!j.contains("tasks") || !j.at("tasks").is_array()) {
        throw std::runtime_error("JSON file does not contain a valid 'tasks' array");
    }

    std::vector<Task> result;
    result.reserve(j.at("tasks").size());

    for (const auto& jt : j.at("tasks")) {
        result.push_back(Task::fromJSON(jt));
    }

    return result;
}

Task Task::fromJSON(const nlohmann::json& j) {
    Task task;

    task.id = utils::require_type<std::string>(j, "id");
    bool mist = utils::require_type<bool>(j, "mist");
    task.type = mist ? TaskType::Mist : TaskType::Regular;
    task.C = utils::require_type<int>(j, "C");
    task.T = utils::require_type<int>(j, "T");
    task.D = utils::require_type<int>(j, "D");
    task.M = utils::require_type<int>(j, "M");
    task.a = utils::require_type<int>(j, "a");

    if(j.contains("successors"))
        task.successors = utils::require_type<std::vector<std::string>>(j, "successors");

    return task;
}

void Task::print() const {
    std::cout << "Task ID: " << id << "\n";
    std::cout << "Type: " << (type == TaskType::Mist ? "MIST" : "REGULAR") << "\n";
    std::cout << "Computation time (C): " << C << "\n";
    std::cout << "Period (T): " << T << "\n";
    std::cout << "Deadline (D): " << D << "\n";
    std::cout << "Memory requirement (M): " << M << "\n";
    std::cout << "Activation time (a): " << a << "\n";
    std::cout << "Start time: " << start_time << "\n";
    std::cout << "Finish time: " << finish_time << "\n";
}