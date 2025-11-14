#include "../include/solver.h"

void Solver::randomSearchSolve() {
 
    const size_t serverCount = scheduler.getServerCount();
    const size_t taskCount = scheduler.getTaskCount();
    
    const int maxIterations = 1000;
    Candidate temp(taskCount);
    int bestSpan = INT_MAX;
    Candidate best(taskCount);
    
    for (int iteration = 0; iteration < maxIterations; ++iteration) {
        for (size_t i = 0; i < taskCount; ++i) {
            // Check if task has fixed allocation
            const Task& task = scheduler.getTask(i);
            if (task.hasFixedAllocation()) {
                temp.server_indices[i] = task.fixedAllocationInternalId;
            }else{
                temp.server_indices[i] = rand() % serverCount; // Random server assignment
            }
            temp.priorities[i] = static_cast<double>(rand()) / RAND_MAX; // Random priority between 0 and 1
        }
        // Schedule using the generated temp
        bool feasible = scheduler.schedule(temp);
        if (feasible) {
            int span = scheduler.getScheduleSpan();
            if (span < bestSpan) {
                bestSpan = span;
                best = temp;
            }
        }
    }

    // Final scheduling with the best candidate found
    if (bestSpan < INT_MAX) {
        scheduler.schedule(best);
    } else {
        utils::dbg << "No feasible schedule found.\n";
    }
}

void Solver::geneticAlgorithmSolve() {
    // Placeholder for genetic algorithm implementation
    utils::dbg << "Genetic Algorithm solver not yet implemented.\n";
}

void Solver::solve(SolverMethod method) {
    switch(method) {
        case SolverMethod::RANDOM_SEARCH:
            randomSearchSolve();
            break;
        case SolverMethod::GENETIC_ALGORITHM:
            geneticAlgorithmSolve();
            break;
        default:
            utils::dbg << "Unknown solver method.\n";
            break;
    }
}