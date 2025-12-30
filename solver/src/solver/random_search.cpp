#include "solver.h"

Candidate Solver::randomSearchSolve() {
    // Performs random search to find a feasible scheduling solution

    int maxIterations = config.rs_maxIterations;
    bool breakOnFirstFeasible = config.rs_breakOnFirstFeasible;
    
    int bestFitness = INT_MAX;
    Candidate curr( scheduler.getTaskCount());
    Candidate best(scheduler.getTaskCount());
    
    for (int iteration = 0; iteration < maxIterations; ++iteration) {
        for (size_t i = 0; i <  scheduler.getTaskCount(); ++i) {
            // Check if task has fixed allocation
            const Task& task = scheduler.getTask(i);
            if (!task.hasFixedAllocation())
                curr.server_indices[i] = rand() % scheduler.getServerCount(); // Random server assignment
            curr.priorities[i] = static_cast<double>(rand()) / RAND_MAX; // Random priority between 0 and 1
        }
        // Schedule using the generated candidate
        if (scheduler.schedule(curr)) { // feasible
            if (breakOnFirstFeasible) {
                return curr;
            }
            // Check if this is the best solution found so far
            //int firness = scheduler.getScheduleSpan();
            int firness = scheduler.getFinishTimeSum();
            if (firness < bestFitness) {
                bestFitness = firness;
                best = curr;
            }
        }
    }

    // Final scheduling with the best candidate found
    if (scheduler.isScheduled()) {
        scheduler.schedule(best);
    } else {
        utils::dbg << "No feasible schedule found.\n";
    }

    return best;
}