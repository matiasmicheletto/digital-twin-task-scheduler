#include "solver.h"

void Solver::randomizeCandidate(Candidate& candidate, double perturbationRate) {
    for (size_t i = 0; i < scheduler.getTaskCount(); ++i) {
        if (rand() / (double)RAND_MAX < perturbationRate) {
            if (!scheduler.getTask(i).hasFixedAllocation()){
                candidate.server_indices[i] = scheduler.getNonMISTServerIdx(rand() % scheduler.getNonMISTServerCount());
                continue; // Priority doesnt matter for fixed allocation tasks
            }
        }
        if (rand() / (double)RAND_MAX < perturbationRate) {
            candidate.priorities[i] += utils::randNormal(0, 0.05);
            candidate.priorities[i] = utils::clamp(candidate.priorities[i], 0.0, 1.0);
        }
    }
}