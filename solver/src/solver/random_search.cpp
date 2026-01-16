#include "solver.h"

Candidate Solver::randomSearchSolve() {
    // Performs random search to find a feasible scheduling solution

    auto start_time = std::chrono::high_resolution_clock::now();

    int maxIterations = config.rs_maxIterations;
    bool breakOnFirstFeasible = config.rs_breakOnFirstFeasible;
    
    int bestFitness = INT_MAX;
    Candidate curr(scheduler.getTaskCount());
    Candidate best(scheduler.getTaskCount());
    
    const size_t allocable_servers_count = scheduler.getNonMISTServerCount();
    if(allocable_servers_count == 0) {
        utils::dbg << "No allocable servers available.\n";
        writeLog(utils::getElapsed(start_time), 0, 0, 0, scheduler.getScheduleState(), "No allocable servers available");
        return best;
    }

    for (int iteration = 0; iteration < maxIterations; ++iteration) {
        for (size_t i = 0; i <  scheduler.getTaskCount(); ++i) {
            // Check if task has fixed allocation
            const Task& task = scheduler.getTask(i);
            if (!task.hasFixedAllocation()){
                //curr.server_indices[i] = rand() % scheduler.getServerCount(); // Random server assignment
                curr.server_indices[i] = scheduler.getNonMISTServerIdx(rand() % allocable_servers_count);
            }
            curr.priorities[i] = static_cast<double>(rand()) / RAND_MAX; // Random priority between 0 and 1
        }
        // Schedule using the generated candidate
        if (scheduler.schedule(curr) == SCHEDULED) { // feasible
            if (breakOnFirstFeasible) {
                return curr;
            }
            // Check if this is the best solution found so far
            //int fitness = scheduler.getScheduleSpan();
            int fitness = computeObjective();
            if (fitness < bestFitness) {
                bestFitness = fitness;
                best = curr;
                utils::dbg << "Iteration " << iteration + 1 << ": New best solution found with finish time sum = " << fitness << "\n";
            }
        }
    }

    // Final scheduling with the best candidate found
    std::string obs = "";
    if (scheduler.getScheduleState() == SCHEDULED) {
        scheduler.schedule(best);
    } else {
        obs = "No feasible schedule found";
        utils::dbg << "No feasible schedule found.\n";
    }

    writeLog(utils::getElapsed(start_time), maxIterations, scheduler.getScheduleSpan(), scheduler.getFinishTimeSum(), scheduler.getScheduleState(), obs);
    return best;
}