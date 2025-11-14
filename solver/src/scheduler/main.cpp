#include "../include/scheduler.h"

Scheduler::Scheduler(std::string tasks_file, std::string network_file) {
    // Sets up the scheduler by loading tasks and network from JSON files
    // Delay matrix is used to define start and finish times of tasks based on communication delays
    loadTasksFromJSONFile(tasks_file);
    loadNetworkFromJSONFile(network_file);
    computeDelayMatrix();
}

void Scheduler::computeDelayMatrix() {
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

bool Scheduler::schedule(const Candidate& candidate)
{
    // Reset servers
    
    for (auto& server : servers)
        server.clearTasks();   
    const size_t num_tasks = tasks.size();
    const size_t num_servers = servers.size();
    bool feasible = true;

    
    
    return feasible;
}