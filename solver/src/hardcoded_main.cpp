#include <iostream>
#include <cstring>

#include "../include/utils.h"
#include "../include/scheduler.h"
#include "../include/solver.h"


int main(int argc, char **argv) {

    //utils::dbg.rdbuf(std::cout.rdbuf()); // Enable debug output to std::cout

    Scheduler sch("./test/sch-instance.json", "./test/nw-instance.json");
    utils::dbg << "Scheduler initialized with "
               << sch.getTaskCount() << " tasks and "
               << sch.getServerCount() << " servers.\n";

    const Candidate candidate{
            .server_indices = {0, 4, 5, 5, 2, 6, 4},
            .priorities = {1.0, 0.5, 0.8, 1.0, 0.2, 0.33, 1.4}
        };

    // Print candidate info
    utils::dbg << "Using hardcoded candidate:\n";
    for (size_t i = 0; i < candidate.server_indices.size(); ++i) {
        utils::dbg << "  Task " << sch.getTask(i).getLabel()
                   << " -> Server " << sch.getServer(candidate.server_indices[i]).getLabel()
                   << ", Priority " << candidate.priorities[i] << "\n";
    }   

    utils::dbg << "Scheduling with hardcoded candidate...\n";
    bool feasible = sch.schedule(candidate);

    sch.print(utils::PRINT_TYPE::SCHEDULE_CSV);

    return 0;
}

