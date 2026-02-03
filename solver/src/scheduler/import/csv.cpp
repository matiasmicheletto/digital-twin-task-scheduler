#include "scheduler.h"

void Scheduler::importScheduleFromCSV(const std::string& csv_data) {
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
    bool force_server_start_format = false; // If header indicates server,start,finish
    int line_number = 0; // counts data lines (non-header, non-empty), 0-based to match DAT task IDs
    
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
                f0.find("servidor") != std::string::npos ||
                f1.find("task") != std::string::npos || f1.find("server") != std::string::npos ||
                f1.find("inicio") != std::string::npos ||
                f2.find("start") != std::string::npos || f2.find("finish") != std::string::npos ||
                f2.find("fin") != std::string::npos) {
                if (f0.find("servidor") != std::string::npos || f1.find("inicio") != std::string::npos || f2.find("fin") != std::string::npos) {
                    force_server_start_format = true;
                }
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
            if (force_server_start_format) {
                task_id = std::to_string(line_number);
                server_id = fields[0];
                start_time_str = fields[1];
            } else {
                const bool task_known = (taskIdToIdx.find(fields[0]) != taskIdToIdx.end()) ||
                                        (taskLabelToIdx.find(fields[0]) != taskLabelToIdx.end());
                const bool server_known = (serverIdToIdx.find(fields[1]) != serverIdToIdx.end()) ||
                                          (serverLabelToIdx.find(fields[1]) != serverLabelToIdx.end());
                if (task_known && server_known) {
                    task_id = fields[0];
                    server_id = fields[1];
                    start_time_str = fields[2];
                } else {
                    // Treat as server_id,start_time,finish (task id inferred by line number)
                    task_id = std::to_string(line_number);
                    server_id = fields[0];
                    start_time_str = fields[1];
                }
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
        // If this task is assigned to a MIST server, mark it as fixed allocation
        if (servers[server_idx].getType() == ServerType::Mist) {
            t.setFixedAllocationId(servers[server_idx].getId());
            t.setFixedAllocationInternalId(server_idx);
        }
        servers[server_idx].pushBackTask(t);
        
        line_number++;
    }

    state = ScheduleState::SCHEDULED;
};