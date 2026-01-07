#include "scheduler.h"

Scheduler::Scheduler(std::string tasks_file, std::string network_file) {
    // Save instance name
    instance_name = tasks_file + " + " + network_file;
    // Sets up the scheduler by loading tasks and network from JSON files
    loadTasksFromJSONFile(tasks_file);
    loadNetworkFromJSONFile(network_file);
    // Delay matrix is used to define start and finish times of tasks based on communication delays
    computeDelayMatrix();
    schedule_state = NOT_SCHEDULED;
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

struct PQItem {
    double pr;
    int idx;
};

struct Cmp {
    bool operator()(const PQItem& a, const PQItem& b) const {
        if (a.pr != b.pr) return a.pr < b.pr; // max-heap
        return a.idx > b.idx; // deterministic tie-break by index (lower index first)
    }
};

ScheduleState Scheduler::schedule(const Candidate& candidate) {
    // Schedules tasks onto servers based on the candidate allocation and priorities
    // Some tasks may be already allocated to specific servers (check task.fixedAllocationTo)
    // Returns true if scheduling was successful, false otherwise (infeasible)
    // Candidate contains:
    // - server_indices: vector<int> of size N (number of tasks), server index assigned to each task
    // - priorities: vector<double> of size N, priority value for

    schedule_state = NOT_SCHEDULED;

    const int N = (int)tasks.size();
    if ((int)candidate.server_indices.size() != N || (int)candidate.priorities.size() != N) {
        // invalid candidate size
        utils::dbg << "Candidate size does not match number of tasks.\n";
        return schedule_state = CANDIDATE_ERROR;
    }

    // Build mapping from internal_id -> index in tasks vector

    utils::dbg << "Starting scheduling of " << N << " tasks.\n";
    std::unordered_map<int,int> id2idx;
    id2idx.reserve(N);
    for (int i = 0; i < N; ++i) {
        id2idx[tasks[i].internal_id] = i;
    }

    // Ensure delay matrix is available
    //if (delay_matrix.empty()) computeDelayMatrix();
    // Validate delay_matrix size vs servers
    //if ((int)delay_matrix.size() != (int)servers.size()) {
    //    utils::dbg << "Delay matrix size does not match number of servers.\n";
    //    return schedule_state;
    //}

    // 1) Compute indegree (number of predecessors) for each task
    utils::dbg << "Computing indegrees for tasks.\n";
    std::vector<int> indeg(N, 0);
    for (int i = 0; i < N; ++i) {
        const auto &pred_ids = tasks[i].getPredecessorInternalIds();
        for (int pid : pred_ids) {
            auto it = id2idx.find(pid);
            if (it == id2idx.end()) {
                // unknown predecessor reference -> infeasible input
                utils::dbg << "Task " << tasks[i].getLabel() << " has unknown predecessor internal ID " << pid << "\n";
                return schedule_state = PRECEDENCES_ERROR;
            }
            ++indeg[i];
        }
    }

    // 2) Kahn's algorithm with priority tie-breaker:
    // We'll use a max-heap ordered by priority value (higher priority popped first).
    utils::dbg << "Performing topological sort of tasks using Kahn's algorithm with priorities.\n";
    std::priority_queue<PQItem, std::vector<PQItem>, Cmp> pq;
    for (int i = 0; i < N; ++i) {
        if (indeg[i] == 0) {
            pq.push(PQItem{ candidate.priorities[i], i });
        }
    }

    utils::dbg << "Processing tasks in topological order.\n";
    std::vector<int> topo_order;
    topo_order.reserve(N);
    while (!pq.empty()) {
        auto it = pq.top(); pq.pop();
        int u = it.idx;
        topo_order.push_back(u);

        // Visit successors: use successor_internal_ids
        const auto& succ_internal_ids = tasks[u].getSuccessorInternalIds();
        for (int succ_internal : succ_internal_ids) {
            auto jt = id2idx.find(succ_internal);
            if (jt == id2idx.end()) {
                // unknown successor reference -> infeasible input
                utils::dbg << "Task " << tasks[u].getId() << " has unknown successor internal ID " << succ_internal << "\n";
                return schedule_state = SUCCESSORS_ERROR;
            }
            int v = jt->second;
            if (--indeg[v] == 0) {
                pq.push(PQItem{ candidate.priorities[v], v });
            }
        }
    }

    // If not all tasks processed -> cycle
    if ((int)topo_order.size() != N){
        utils::dbg << "Cycle detected in task graph. Scheduling infeasible.\n";
        return schedule_state = CYCLE_ERROR;
    }

    // 3) Schedule tasks in topo order.
    // Keep track of server availability time (when server becomes free)
    const int S = (int)servers.size();
    std::vector<long long> server_ready(S, 0LL);

    // Before assigning tasks, clear server assigned tasks (optional, but convenient)
    for (auto &srv : servers) srv.clearTasks();

    // For each task in topological order compute earliest start
    utils::dbg << "Assigning tasks to servers based on candidate allocation.\n";
    for (int idx : topo_order) {
        Task &t = tasks[idx];

        // Find server assigned
        int server_idx = candidate.server_indices[idx];
        if (server_idx < 0 || server_idx >= S){
            // invalid server index
            utils::dbg << "Task " << t.getLabel() << " assigned to invalid server index " << server_idx << "\n";
            return schedule_state = CANDIDATE_ERROR;
        }

        // earliest start considering activation time a
        long long earliest = (long long)t.getA();

        // predecessors constraints
        const auto& pred_internal_ids = t.getPredecessorInternalIds();
        for (int pred_internal : pred_internal_ids) {
            auto it = id2idx.find(pred_internal);
            if (it == id2idx.end()){ 
                // unknown predecessor reference -> infeasible input
                utils::dbg << "Task " << t.getId() << " has unknown predecessor internal ID " << pred_internal << "\n";
                return schedule_state = PRECEDENCES_ERROR;
            }
            int pidx = it->second;
            const Task &pt = tasks[pidx];

            // must have been scheduled already (topo order ensures this)
            long long pred_finish = (long long)pt.getFinishTime();
            int pred_server = candidate.server_indices[pidx];

            // get communication delay
            if (pred_server == server_idx) {
                // same server: no network delay
                earliest = std::max(earliest, pred_finish);
            } else {
                int delay = delay_matrix[pred_server][server_idx];
                if (delay == INT_MAX) {
                    // disconnected servers -> infeasible
                    utils::dbg << "Task " << t.getLabel() << " predecessor " << pt.getLabel() << " on disconnected servers.\n";
                    return schedule_state = PRECEDENCES_ERROR;
                }
                long long candidate_start = pred_finish + (long long)delay;
                earliest = std::max(earliest, candidate_start);
            }
        }

        // server availability constraint
        earliest = std::max(earliest, server_ready[server_idx]);

        // Now set start time (cast to int safely, but check overflow)
        if (earliest > INT_MAX){
            utils::dbg << "Task " << t.getLabel() << " earliest start time overflow: " << earliest << "\n";
            return schedule_state = CANDIDATE_ERROR; // too large
        }
        t.setStartTime((int)earliest); // setStartTime updates finish_time = start + C (internally)

        // Check deadline if D > 0. Interpret deadline as relative to activation a: finish <= a + D
        int D = t.getD();
        if (D > 0) {
            long long latest_allowed_finish = (long long)t.getA() + (long long)D;
            if ((long long)t.getFinishTime() > latest_allowed_finish) {
                // misses deadline -> infeasible
                utils::dbg << "Task " << t.getId() << " misses deadline. Finish: " << t.getFinishTime() << ", Allowed: " << latest_allowed_finish << "\n";
                return schedule_state = DEADLINE_MISSED;
            }
        }

        // Update server ready time (server executes tasks sequentially)
        server_ready[server_idx] = (long long)t.getFinishTime();

        // Append task to server assigned tasks (copy)
        servers[server_idx].pushBackTask(t);
        const double avail_u = servers[server_idx].getAvailableUtilization();
        if (avail_u < 0.0) {
            utils::dbg << "Server " << servers[server_idx].getLabel() << " over-utilized after assigning task " << t.getLabel() << ". Available utilization: " << avail_u << "\n";
            return schedule_state = UTILIZATION_UNFEASIBLE; // over-utilization -> infeasible
        }
    }

    // All tasks scheduled successfully
    utils::dbg << "All tasks scheduled successfully.\n";
    utils::dbg << "Final server utilizations:\n";

    // Check if dbg is enabled before looping
    if(utils::dbg.rdbuf() != utils::null_stream.rdbuf()) {
        for (int sidx = 0; sidx < S; ++sidx) {
            utils::dbg << "  Server " << servers[sidx].getLabel() << ": Utilization " << (1.0 - servers[sidx].getAvailableUtilization()) << "\n";
        }
        utils::dbg << "Tasks allocation:" << "\n";
        for (int sidx = 0; sidx < S; ++sidx) {
            const auto& assigned = servers[sidx].getAssignedTasks();
            utils::dbg << "  Server " << servers[sidx].getLabel() << ": ";
            for (const auto& tsk : assigned) {
                utils::dbg << tsk.getLabel() << " (Start: " << tsk.getStartTime() << ", Finish: " << tsk.getFinishTime() << "); ";
            }
            utils::dbg << "\n";
        }
    }

    return schedule_state = SCHEDULED;
}

int Scheduler::getScheduleSpan() const {
    if (schedule_state != SCHEDULED) {
        utils::dbg << "Schedule not computed yet.\n";
        return -1;
    }
    int span = 0;
    for (const auto& t : tasks) {
        span = std::max(span, t.getFinishTime());
    }
    return span;
}

int Scheduler::getFinishTimeSum() const {
    if (schedule_state != SCHEDULED) {
        utils::dbg << "Schedule not computed yet.\n";
        return -1;
    }
    int finish_time_sum = 0;
    for (const auto& t : tasks) {
        finish_time_sum += t.getFinishTime();
    }
    return finish_time_sum;
}

std::string Scheduler::printScheduleState() const {
    switch (schedule_state) {
        case NOT_SCHEDULED:
            return "NOT_SCHEDULED";
        case SCHEDULED:
            return "SCHEDULED";
        case CANDIDATE_ERROR:
            return "CANDIDATE_ERROR";
        case PRECEDENCES_ERROR:
            return "PRECEDENCES_ERROR";
        case SUCCESSORS_ERROR:
            return "SUCCESSORS_ERROR";
        case CYCLE_ERROR:
            return "CYCLE_ERROR";
        case DEADLINE_MISSED:
            return "DEADLINE_MISSED";
        case UTILIZATION_UNFEASIBLE:
            return "UTILIZATION_UNFEASIBLE";
        default:
            return "UNKNOWN_STATE";
    }
}