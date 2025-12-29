#include "solver.h"

Candidate Solver::simulatedAnnealingSolve(int maxInitTries, int maxIters, int maxNeighborTries, double initialTemperature, double coolingRate, double minTemperature) {

    // Initialize using random search to find an initial feasible solution
    Candidate curr = randomSearchSolve(maxInitTries, true);
    if (!scheduler.isScheduled()) {
        utils::dbg << "SA: Could not find initial feasible solution.\n";
        return Candidate(scheduler.getTaskCount());
    }

    int currSpan = scheduler.getScheduleSpan();
    Candidate best = curr;
    int bestSpan = currSpan;

    double T = initialTemperature;
    Candidate next(scheduler.getTaskCount());
    for (int iter = 0; iter < maxIters && T > minTemperature; ++iter) {

        bool hasFeasibleNeighbor = false;
        int nextSpan = INT_MAX;

        // Try several neighbors at this temperature
        for (int tr = 0; tr < maxNeighborTries && !hasFeasibleNeighbor; ++tr) {

            next = curr;

            // multi-perturbation: modify k tasks
            int k = 1 + rand() % 5;   // 1–5 tasks
            for (int m = 0; m < k; ++m) {
                size_t idx = rand() % scheduler.getTaskCount();
                const Task& task = scheduler.getTask(idx);

                if (!task.hasFixedAllocation())
                    next.server_indices[idx] = rand() % scheduler.getServerCount();
                next.priorities[idx] = static_cast<double>(rand()) / RAND_MAX;
            }

            if (scheduler.schedule(next)) {
                nextSpan = scheduler.getScheduleSpan();
                hasFeasibleNeighbor = true;
            }
        }

        if (!hasFeasibleNeighbor) {
            // no feasible neighbor found at this T — keep cooling
            T *= coolingRate;
            continue;
        }

        // Accept / reject rule
        bool accept = false;

        if (nextSpan < currSpan) {
            // improvement
            accept = true;
        } else {
            // probabilistic acceptance
            double delta = nextSpan - currSpan;
            double prob  = exp(-delta / T);
            double r     = static_cast<double>(rand()) / RAND_MAX;
            if (r < prob) accept = true;
        }

        if (accept) {
            curr     = next;
            currSpan = nextSpan;

            if (nextSpan < bestSpan) {
                bestSpan = nextSpan;
                best     = next;
            }
        }

        T *= coolingRate;
    }

    if (bestSpan < INT_MAX)
        scheduler.schedule(best);
    else
        utils::dbg << "SA: No feasible solution found.\n";

    return best;
}