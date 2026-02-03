#include "solver.h"

void Solver::randomizeCandidate(Candidate& candidate) {
    for (size_t i = 0; i <  scheduler.getTaskCount(); ++i) {
        // Check if task has fixed allocation
        const Task& task = scheduler.getTask(i);
        if (!task.hasFixedAllocation()){
            candidate.server_indices[i] = scheduler.getNonMISTServerIdx(rand() % scheduler.getNonMISTServerCount());
            continue; // Priority doesnt matter for fixed allocation tasks
        }
        // Random priority between 0 and 1
        // Optimization algorithms do not need to clamp priorities values (outside [0,1]) as allocation work with relative values
        candidate.priorities[i] = static_cast<double>(rand()) / RAND_MAX; 
    }
}