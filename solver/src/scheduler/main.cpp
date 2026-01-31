#include "scheduler.h"

Scheduler::Scheduler(std::string dat_file) {
    // Save instance name
    instance_name = dat_file;
    // Sets up the scheduler by loading schedule from a .dat file
    loadScheduleFromDatFile(dat_file);
    // Delay matrix is used to define start and finish times of tasks based on communication delays
    computeDelayMatrix();
    state = ScheduleState::NOT_SCHEDULED;
};

Scheduler::Scheduler(std::string tasks_file, std::string network_file) {
    // Save instance name
    instance_name = tasks_file + " + " + network_file;
    // Sets up the scheduler by loading tasks and network from JSON files
    loadTasksFromJSONFile(tasks_file);
    loadNetworkFromJSONFile(network_file);
    // Delay matrix is used to define start and finish times of tasks based on communication delays
    computeDelayMatrix();
    state = ScheduleState::NOT_SCHEDULED;
};

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
    
    /*  If allow data to be routed via multiple hops, uncomment this section
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
    */

    utils::dbg << "Computed delay matrix:\n";
};

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

    state = ScheduleState::NOT_SCHEDULED;

    const int N = (int)tasks.size();
    if ((int)candidate.server_indices.size() != N || (int)candidate.priorities.size() != N) {
        // invalid candidate size
        utils::dbg << "Candidate size does not match number of tasks.\n";
        return state = ScheduleState::CANDIDATE_ERROR;
    }

    // Build mapping from internal_idx -> index in tasks vector

    std::unordered_map<int,int> taskIdToInternalIdx;
    taskIdToInternalIdx.reserve(N);
    for (int i = 0; i < N; ++i) {
        taskIdToInternalIdx[tasks[i].getInternalIdx()] = i;
    }

    // 1) Compute indegree (number of predecessors) for each task
    std::vector<int> indeg(N, 0);
    for (int i = 0; i < N; ++i) {
        indeg[i] = (int)tasks[i].getPredecessorInternalIdxs().size();
    }

    // 2) Kahn's algorithm with priority tie-breaker:
    // We'll use a max-heap ordered by priority value (higher priority popped first).
    std::priority_queue<PQItem, std::vector<PQItem>, Cmp> pq;
    for (int i = 0; i < N; ++i) {
        if (indeg[i] == 0) {
            pq.push(PQItem{ candidate.priorities[i], i });
        }
    }

    std::vector<int> topo_order;
    topo_order.reserve(N);
    while (!pq.empty()) {
        auto it = pq.top(); pq.pop();
        int u = it.idx;
        topo_order.push_back(u);

        // Visit successors: use successor_internal_idxs
        const auto& succ_internal_ids = tasks[u].getSuccessorInternalIdxs();
        for (int succ_internal : succ_internal_ids) {
            auto jt = taskIdToInternalIdx.find(succ_internal);
            if (jt == taskIdToInternalIdx.end()) {
                // unknown successor reference -> infeasible input
                utils::dbg << "Task " << tasks[u].getId() << " has unknown successor internal index " << succ_internal << "\n";
                return state = ScheduleState::SUCCESSORS_ERROR;
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
        utils::dbg << "Topological order size: " << topo_order.size() << ", Number of tasks: " << N << "\n";
        return state = ScheduleState::CYCLE_ERROR;
    }

    // 3) Schedule tasks in topo order.
    // Keep track of server availability time (when server becomes free)
    const int S = (int)servers.size();
    std::vector<long long> server_ready(S, 0LL); // initially all servers ready at time 0

    // Before assigning tasks, clear server assigned tasks (except MIST tasks already allocated)
    for (auto &srv : servers) srv.clearTasks();

    // For each task in topological order compute earliest start
    for (int idx : topo_order) {
        Task &t = tasks[idx];

        // Find assigned server
        const int server_idx = t.hasFixedAllocation() ? t.getFixedAllocationInternalIdx() : candidate.server_indices[idx]; 

        if(server_idx < 0 || server_idx >= S){
            utils::dbg << "Task " << t.getLabel() << " assigned to invalid server index " << server_idx << "\n";
            return state = ScheduleState::CANDIDATE_ERROR;
        }
        
        if (servers[server_idx].getType() == ServerType::Mist && !t.hasFixedAllocation()) {
            utils::dbg << "Task " << t.getLabel()
                    << " cannot be assigned to MIST server "
                    << servers[server_idx].getLabel() << ".\n";
            return state = ScheduleState::CANDIDATE_ERROR;
        }
        
        if (server_idx < 0 || server_idx >= S){
            // invalid server index
            utils::dbg << "Task " << t.getLabel() << " assigned to invalid server index " << server_idx << "\n";
            return state = ScheduleState::CANDIDATE_ERROR;
        }

        // earliest start considering activation time a
        long long earliest = (long long)t.getA();

        // predecessors constraints
        const auto& pred_internal_idxs = t.getPredecessorInternalIdxs();
        for (int pred_internal : pred_internal_idxs) {
            auto it = taskIdToInternalIdx.find(pred_internal);
            if (it == taskIdToInternalIdx.end()){ 
                // unknown predecessor reference -> infeasible input
                utils::dbg << "Task " << t.getId() << " has unknown predecessor internal index " << pred_internal << "\n";
                return state = ScheduleState::PRECEDENCES_ERROR;
            }
            int pidx = it->second;
            const Task &pt = tasks[pidx];

            // must have been scheduled already (topo order ensures this)
            long long pred_finish = (long long)pt.getFinishTime();
            int pred_server = pt.hasFixedAllocation() ? pt.getFixedAllocationInternalIdx() : candidate.server_indices[pidx];

            // get communication delay
            if (pred_server == server_idx) {
                // same server: no network delay
                earliest = std::max(earliest, pred_finish);
            } else {
                int delay = delay_matrix[pred_server][server_idx];
                if (delay == INT_MAX) {
                    // disconnected servers -> infeasible
                    utils::dbg << "Task " << t.getLabel() << " predecessor " << pt.getLabel() << " on disconnected servers.\n";
                    return state = ScheduleState::PRECEDENCES_ERROR;
                }
                long long candidate_start = pred_finish + (long long)delay + 1LL; // +1 since finish is inclusive
                earliest = std::max(earliest, candidate_start);
            }
        }
        
        // server availability constraint
        earliest = std::max(earliest, server_ready[server_idx]);

        // Now set start time (cast to int safely, but check overflow)
        if (earliest > INT_MAX){
            utils::dbg << "Task " << t.getLabel() << " earliest start time overflow: " << earliest << "\n";
            return state = ScheduleState::CANDIDATE_ERROR; // too large
        }
        t.setStartTime((int)earliest); // setStartTime updates finish_time = start + C - 1 (internally)

        // Check deadline if D > 0. Interpret deadline as relative to activation a: finish <= a + D
        int D = t.getD();
        if (D > 0) {
            long long latest_allowed_finish = (long long)t.getA() + (long long)D;
            if ((long long)t.getFinishTime() > latest_allowed_finish) {
                // misses deadline -> infeasible
                utils::dbg << "Task " << t.getId() << " misses deadline. Finish: " << t.getFinishTime() << ", Allowed: " << latest_allowed_finish << "\n";
                return state = ScheduleState::DEADLINE_MISSED;
            }
        }
        
        // Update server ready time (server executes tasks sequentially)
        if (servers[server_idx].getType() != ServerType::Mist) {
            server_ready[server_idx] = (long long)t.getFinishTime() + 1LL; // next available time slot
        }else{
            if (!servers[server_idx].getAssignedTasks().empty()) {
                utils::dbg << "Mist server " << servers[server_idx].getLabel()
                        << " already has a task assigned.\n";
                return state = ScheduleState::CANDIDATE_ERROR;
            }
        }

        // Append task to server assigned tasks (copy)
        servers[server_idx].pushBackTask(t);
        const double avail_u = servers[server_idx].getAvailableUtilization();
        if (avail_u < 0.0) {
            utils::dbg << "Server " << servers[server_idx].getLabel() << " over-utilized after assigning task " << t.getLabel() << ". Available utilization: " << avail_u << "\n";
            return state = ScheduleState::UTILIZATION_UNFEASIBLE; // over-utilization -> infeasible
        }
        const int avail_mem = servers[server_idx].getAvailableMemory();
        if (avail_mem < 0) {
            utils::dbg << "Server " << servers[server_idx].getLabel() << " out of memory after assigning task " << t.getLabel() << ". Available memory: " << avail_mem << "\n";
            return state = ScheduleState::MEMORY_UNFEASIBLE; // out of memory -> infeasible
        }
    }

    return state = ScheduleState::SCHEDULED;
};

void Scheduler::setSchedule(const std::string& csv_data) {
    // Loads a schedule from CSV data stored in a string
    // CSV format: task_id,server_id,start_time[,finish]
    //         OR: server_id,start_time[,finish] (uses line number as task_id)

    std::istringstream infile(csv_data);

    std::string line;

    std::unordered_map<std::string, int> taskIdToIdx;
    std::unordered_map<std::string, int> taskLabelToIdx;
    for (size_t i = 0; i < tasks.size(); ++i) {
        taskIdToIdx[tasks[i].getId()] = static_cast<int>(i);
        taskLabelToIdx[tasks[i].getLabel()] = static_cast<int>(i);
    }

    std::unordered_map<std::string, int> serverIdToIdx;
    std::unordered_map<std::string, int> serverLabelToIdx;
    for (size_t j = 0; j < servers.size(); ++j) {
        serverIdToIdx[servers[j].getId()] = static_cast<int>(j);
        serverLabelToIdx[servers[j].getLabel()] = static_cast<int>(j);
    }

    // Clear all server tasks first
    clearAllServerTasks();

    auto trim = [](std::string& s) {
        const char* ws = " \t\r\n";
        s.erase(0, s.find_first_not_of(ws));
        s.erase(s.find_last_not_of(ws) + 1);
    };

    bool header_checked = false;
    int line_number = 0; // counts data lines (non-header, non-empty)
    
    while (std::getline(infile, line)) {
        if (line.empty()) continue;

        // Split line by ','
        std::vector<std::string> fields;
        {
            std::istringstream ss(line);
            std::string field;
            while (std::getline(ss, field, ',')) {
                trim(field);
                fields.push_back(field);
            }
        }
        if (fields.size() < 2) continue;

        // Detect and skip header on the first non-empty line only
        if (!header_checked) {
            header_checked = true;
            auto lower = [](std::string s) {
                std::transform(s.begin(), s.end(), s.begin(), [](unsigned char c){ return std::tolower(c); });
                return s;
            };
            std::string f0 = lower(fields[0]);
            std::string f1 = lower(fields.size() > 1 ? fields[1] : "");
            std::string f2 = lower(fields.size() > 2 ? fields[2] : "");
            if (f0.find("task") != std::string::npos || f0.find("server") != std::string::npos ||
                f1.find("task") != std::string::npos || f1.find("server") != std::string::npos ||
                f2.find("start") != std::string::npos || f2.find("finish") != std::string::npos) {
                continue;
            }
        }

        std::string task_id, server_id, start_time_str;

        // Decide format based on field count and whether task id is known
        if (fields.size() >= 4) {
            // task_id,server_id,start_time,finish (finish ignored)
            task_id = fields[0];
            server_id = fields[1];
            start_time_str = fields[2];
        } else if (fields.size() == 3) {
            // Either task_id,server_id,start_time OR server_id,start_time,finish
            const bool task_known = (taskIdToIdx.find(fields[0]) != taskIdToIdx.end()) ||
                                    (taskLabelToIdx.find(fields[0]) != taskLabelToIdx.end());
            if (task_known) {
                task_id = fields[0];
                server_id = fields[1];
                start_time_str = fields[2];
            } else {
                task_id = std::to_string(line_number);
                server_id = fields[0];
                start_time_str = fields[1];
            }
        } else {
            // 2-column format: server_id,start_time (use line number as task_id)
            task_id = std::to_string(line_number);
            server_id = fields[0];
            start_time_str = fields[1];
        }

        auto task_it = taskIdToIdx.find(task_id);
        if (task_it == taskIdToIdx.end()) {
            task_it = taskLabelToIdx.find(task_id);
        }
        auto server_it = serverIdToIdx.find(server_id);
        if (server_it == serverIdToIdx.end()) {
            server_it = serverLabelToIdx.find(server_id);
        }
        if (task_it == taskIdToIdx.end() || server_it == serverIdToIdx.end()) {
            utils::dbg << "Unknown task or server ID in schedule CSV: " << line << "\n";
            line_number++;
            continue;
        }

        int task_idx   = task_it->second;
        int server_idx = server_it->second;
        int start_time = std::stoi(start_time_str);

        Task& t = tasks[task_idx];
        t.setStartTime(start_time);
        servers[server_idx].pushBackTask(t);
        
        line_number++;
    }

    state = ScheduleState::SCHEDULED;
};


Candidate Scheduler::getCandidateFromCurrentSchedule() const {
    // Constructs a Candidate from the current schedule state
    Candidate candidate(tasks.size());
    for (size_t i = 0; i < tasks.size(); ++i) {
        const Task& t = tasks[i];
        int server_idx = -1;
        // Find server hosting this task
        for (size_t j = 0; j < servers.size(); ++j) {
            const Server& srv = servers[j];
            const auto& assigned_tasks = srv.getAssignedTasks();
            auto it = std::find_if(assigned_tasks.begin(), assigned_tasks.end(), [&t](const Task& at){
                return at.getInternalIdx() == t.getInternalIdx();
            });
            if (it != assigned_tasks.end()) {
                server_idx = (int)j;
                break;
            }
        }
        candidate.server_indices[i] = server_idx;
    }

    // Set priorities based on start times (earlier start -> higher priority)
    std::vector<std::pair<int, int>> start_times; // (start_time, task_index)
    start_times.reserve(tasks.size());
    for (size_t i = 0; i < tasks.size(); ++i) {
        start_times.emplace_back(tasks[i].getStartTime(), (int)i);
    }
    // Sort by start time ascending
    std::sort(start_times.begin(), start_times.end());
    // Assign priorities: earlier start time -> higher priority value
    for (size_t rank = 0; rank < start_times.size(); ++rank) {
        int task_idx = start_times[rank].second;
        // Higher priority for earlier start (e.g., inverse of rank)
        candidate.priorities[task_idx] = (double)(tasks.size() - rank);
    }

    return candidate;
};



int Scheduler::getScheduleSpan() const {
    // Returns the schedule span (makespan), i.e., the finish time of the last finishing task
    if (state != ScheduleState::SCHEDULED) {
        utils::dbg << "Schedule not computed yet.\n";
        return -1;
    }
    int span = 0;
    for (const auto& t : tasks) {
        span = std::max(span, t.getFinishTime());
    }
    return span;
};

int Scheduler::getFinishTimeSum() const {
    // Returns the sum of finish times of all tasks in the schedule
    if (state != ScheduleState::SCHEDULED) {
        utils::dbg << "Schedule not computed yet.\n";
        return -1;
    }
    int finish_time_sum = 0;
    for (const auto& t : tasks) {
        finish_time_sum += t.getFinishTime()+1; // finish time is inclusive, so add 1
    }
    return finish_time_sum;
};

int Scheduler::getProcessorsCost() const {
    // Returns the total cost of used processors in the schedule
    if (state != ScheduleState::SCHEDULED) {
        utils::dbg << "Schedule not computed yet.\n";
        return -1;
    }
    int total_cost = 0;
    for (const auto& srv : servers) {
        total_cost += srv.getCost() * (int)srv.getAssignedTasks().size();
    }
    return total_cost;
};

int Scheduler::getDelayCost() const {
    if (state != ScheduleState::SCHEDULED) {
        utils::dbg << "Schedule not computed yet.\n";
        return -1;
    }
    int total_delay = 0;
    for (const auto& t : tasks) {
        const auto& pred_internal_idxs = t.getPredecessorInternalIdxs();
        int task_server = t.hasFixedAllocation() ? t.getFixedAllocationInternalIdx() : -1;
        for (int pred_internal : pred_internal_idxs) { // for each predecessor of t, find its server and add delay
            auto it = std::find_if(tasks.begin(), tasks.end(), [pred_internal](const Task& task) {
                return task.getInternalIdx() == pred_internal;
            });
            if (it != tasks.end()) { // found predecessor task
                const Task &pt = *it;
                int pred_server = pt.hasFixedAllocation() ? pt.getFixedAllocationInternalIdx() : -1;
                if (task_server != -1 && pred_server != -1 && task_server != pred_server) { // both servers known and different
                    int delay = delay_matrix[pred_server][task_server];
                    if (delay != INT_MAX) {
                        total_delay += delay;
                    }
                }
            }
        }
    }
    return total_delay;
};

void Scheduler::clearAllServerTasks() {
    // Clears all assigned tasks from all servers to prevent accessing corrupted data
    for (auto& server : servers) {
        server.clearTasks();
    }
};
