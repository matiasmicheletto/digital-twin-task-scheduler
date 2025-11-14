#include "../include/digital_twin.h"

DigitalTwin::DigitalTwin(std::string tasks_file, std::string network_file) {
    // Sets up the digital twin by loading tasks and network from JSON files
    // Delay matrix is used to define start and finish times of tasks based on communication delays
    loadTasksFromJSONFile(tasks_file);
    loadNetworkFromJSONFile(network_file);
    computeDelayMatrix();
}

void DigitalTwin::computeDelayMatrix() {
    // Computes the delay matrix based on connections. If no direct connection, delay is computed by minimal paths.
    int n = servers.size();
    delay_matrix.resize(n, std::vector<int>(n, INT_MAX));
    for (int i = 0; i < n; ++i) {
        delay_matrix[i][i] = 0; // Zero delay to self
    }
    for (const auto& conn : connections) {
        delay_matrix[conn.from_server_index][conn.to_server_index] = conn.delay;
        if (conn.bidirectional) {
            delay_matrix[conn.to_server_index][conn.from_server_index] = conn.delay;
        }
    }
    // Floyd-Warshall algorithm for all-pairs shortest paths
    for (int k = 0; k < n; ++k) {
        for (int i = 0; i < n; ++i) {
            for (int j = 0; j < n; ++j) {
                if (delay_matrix[i][k] != INT_MAX && delay_matrix[k][j] != INT_MAX) {
                    delay_matrix[i][j] = std::min(delay_matrix[i][j], delay_matrix[i][k] + delay_matrix[k][j]);
                }
            }
        }
    }
}

bool DigitalTwin::schedule(const Candidate& candidate)
{
    // -------------------------------------------------------------
    // STEP 0 — Reset servers
    // -------------------------------------------------------------
    for (auto& server : servers)
        server.clearTasks();
    
    const size_t num_tasks = tasks.size();
    const size_t num_servers = servers.size();
    bool feasible = true;

    // -------------------------------------------------------------
    // STEP 1 — Assign tasks to servers and sort by priority
    // -------------------------------------------------------------
    std::vector<std::vector<int>> tasks_per_server(num_servers);

    for (size_t t = 0; t < num_tasks; ++t) {
        int s = candidate.server_indices[t];
        if (s < 0 || s >= (int)num_servers) {
            utils::dbg << "Invalid server index " << s << " for task " << t << "\n";
            return false;
        }
        tasks_per_server[s].push_back(t);
    }

    // Sort tasks on each server by ascending priority
    for (size_t s = 0; s < num_servers; ++s) {
        auto& vec = tasks_per_server[s];
        std::sort(vec.begin(), vec.end(),
            [&](int a, int b) {
                return candidate.priorities[a] < candidate.priorities[b];
            });
        // Push the sorted tasks
        for (int t : vec)
            servers[s].pushBackTask(tasks[t]);
    }

    // -------------------------------------------------------------
    // STEP 2 — Build fast lookup using internal_id of tasks
    // -------------------------------------------------------------
    // Maps internal_id -> pointer to task IN THE SERVER's deque
    std::vector<Task*> id_to_task(num_tasks, nullptr);
    std::vector<size_t> id_to_server(num_tasks, 0);

    for (size_t s = 0; s < servers.size(); ++s) {
        auto& assigned = servers[s].getAssignedTasks();
        for (Task& task : assigned) {
            int internal_id = task.internal_id;
            if (internal_id >= 0 && internal_id < (int)num_tasks) {
                id_to_task[internal_id] = &task;
                id_to_server[internal_id] = s;
            }
        }
    }

    // -------------------------------------------------------------
    // STEP 3 — Compute start and finish times (non-preemptive)
    // -------------------------------------------------------------
    bool updated = true;
    while (updated) {
        updated = false;
        for (size_t s = 0; s < num_servers; ++s) {
            int current_time = 0;
            for (Task& task : servers[s].getAssignedTasks()) {
                int earliest_start = current_time; // Based on server availability

                // Check predecessors
                for (size_t i = 0; i < task.getPredecessors().size(); ++i) {
                    int pred_internal_id = task.getPredecessorInternalIds()[i];
                    if (pred_internal_id < 0 || pred_internal_id >= (int)num_tasks ||
                        id_to_task[pred_internal_id] == nullptr) {
                        utils::dbg << "Predecessor task internal_id " << pred_internal_id 
                                   << " not found for task " << task.getId() << "\n";
                        feasible = false;
                        continue;
                    }
                    Task* pred_task = id_to_task[pred_internal_id];
                    size_t pred_server_index = id_to_server[pred_internal_id];
                    
                    int pred_finish = pred_task->getFinishTime();
                    
                    int comm_delay = delay_matrix[pred_server_index][s];
                    int ready_time = pred_finish + comm_delay;
                    
                    if (ready_time > earliest_start) {
                        earliest_start = ready_time;
                    }
                }

                if (task.getStartTime() != earliest_start) {
                    task.setStartTime(earliest_start);
                    updated = true;
                }

                current_time = task.getFinishTime();
            }
        }
    }

    // -------------------------------------------------------------
    // STEP 4 — Check constraints: memory, utilization, deadlines
    // -------------------------------------------------------------
    for (size_t s = 0; s < num_servers; ++s) {

        const auto& assigned = servers[s].getAssignedTasks();

        int total_memory = 0;
        double total_util = 0.0;

        for (const Task& task : assigned) {

            total_memory += task.getM();
            total_util   += task.getU();

            // deadline feasibility
            if (task.getFinishTime() > task.getD()){
                feasible = false;
            }
        }

        if (total_memory > servers[s].getMemory()){
            utils::dbg << "Memory exceeded on server " << servers[s].getId() << ": "
                       << total_memory << " > " << servers[s].getMemory() << "\n";
            feasible = false;
        }

        if (total_util > servers[s].getUtilization()){
            utils::dbg << "Utilization exceeded on server " << servers[s].getId() << ": "
                       << total_util << " > 1.0\n";
            feasible = false;
        }

        if (!feasible){
            utils::dbg << "Constraints violated on server " << servers[s].getId() << "\n";
            break;
        }
    }

    scheduled = feasible;
    return feasible;
}