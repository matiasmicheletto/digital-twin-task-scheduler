#include "solver.h"

Candidate Solver::simulatedAnnealingSolve() {
    // Parameters from config
    int maxInitTries        = config.sa_maxInitTries;
    int maxIterations       = config.sa_maxIterations;
    int maxNeighborTries    = config.sa_maxNeighborTries;
    double initialTemperature = config.sa_initialTemperature;
    double coolingRate      = config.sa_coolingRate;
    double minTemperature   = config.sa_minTemperature;

    // Initialize using random search to find an initial feasible solution
    config.rs_breakOnFirstFeasible = true;
    config.rs_maxIterations = maxInitTries;
    Candidate curr = randomSearchSolve();
    if (scheduler.getScheduleState() != SCHEDULED) {
        utils::dbg << "SA: Could not find initial feasible solution.\n";
        return Candidate(scheduler.getTaskCount());
    }

    //int currFitness = scheduler.getScheduleSpan();
    int currFitness = scheduler.getFinishTimeSum();
    Candidate best = curr;
    int bestFitness = currFitness;

    double T = initialTemperature;
    Candidate next(scheduler.getTaskCount());
    for (int iter = 0; iter < maxIterations && T > minTemperature; ++iter) {

        bool hasFeasibleNeighbor = false;
        int nextFitness = INT_MAX;

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

            if (scheduler.schedule(next) == SCHEDULED) { // schedule() is expensive, so only call it once per neighbor
                //nextFitness = scheduler.getScheduleFitness();
                nextFitness = scheduler.getFinishTimeSum();
                hasFeasibleNeighbor = true; // found a feasible neighbor, exit inner loop
                if (nextFitness < currFitness)
                    break; // improvement found — stop searching
            }
        }

        if (!hasFeasibleNeighbor) {
            // no feasible neighbor found at this T — keep cooling
            T *= coolingRate;
            continue;
        }

        // Accept / reject rule
        bool accept = false;

        if (nextFitness < currFitness) {
            // improvement
            accept = true;
        } else {
            // probabilistic acceptance
            double delta = nextFitness - currFitness;
            double prob  = exp(-delta / T);
            double r     = static_cast<double>(rand()) / RAND_MAX;
            if (r < prob) accept = true;
        }

        if (accept) {
            curr     = next;
            currFitness = nextFitness;

            refinePriorities(config.sa_priorityRefinementMethod, curr, currFitness, T);

            if (currFitness < bestFitness) {
                bestFitness = currFitness;
                best     = curr;
            }
        }

        T *= coolingRate;
    }

    if (bestFitness < INT_MAX)
        scheduler.schedule(best);
    else
        utils::dbg << "SA: No feasible solution found.\n";

    return best;
}