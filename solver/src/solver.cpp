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

void Solver::simulatedAnnealingSolve() {

    const size_t serverCount = scheduler.getServerCount();
    const size_t taskCount   = scheduler.getTaskCount();

    const int    maxIter   = 5000;
    const int    maxInitTries = 3000;
    const int    maxNeighborTries = 20;

    double       T       = 100.0;    // initial temperature
    const double alpha   = 0.995;    // cooling rate
    const double Tmin    = 1e-3;

    Candidate curr(taskCount);
    Candidate next(taskCount);
    Candidate best(taskCount);

    int currSpan = INT_MAX;
    int bestSpan = INT_MAX;

    // ---------------------------------------------------------
    // 1) FIND FEASIBLE INITIAL SOLUTION (critical)
    // ---------------------------------------------------------
    bool foundInit = false;

    for (int attempts = 0; attempts < maxInitTries && !foundInit; ++attempts) {

        for (size_t i = 0; i < taskCount; ++i) {
            const Task& task = scheduler.getTask(i);

            if (task.hasFixedAllocation())
                curr.server_indices[i] = task.fixedAllocationInternalId;
            else
                curr.server_indices[i] = rand() % serverCount;

            curr.priorities[i] = static_cast<double>(rand()) / RAND_MAX;
        }

        if (scheduler.schedule(curr)) {
            currSpan  = scheduler.getScheduleSpan();
            bestSpan  = currSpan;
            best      = curr;
            foundInit = true;
        }
    }

    if (!foundInit) {
        utils::dbg << "SA: Could not find initial feasible solution.\n";
        return;
    }

    // ---------------------------------------------------------
    // 2) MAIN SIMULATED ANNEALING LOOP
    // ---------------------------------------------------------
    for (int iter = 0; iter < maxIter && T > Tmin; ++iter) {

        bool hasFeasibleNeighbor = false;
        int nextSpan = INT_MAX;

        // Try several neighbors at this temperature
        for (int tr = 0; tr < maxNeighborTries && !hasFeasibleNeighbor; ++tr) {

            next = curr;

            // multi-perturbation: modify k tasks
            int k = 1 + rand() % 5;   // 1–5 tasks
            for (int m = 0; m < k; ++m) {
                size_t idx = rand() % taskCount;
                const Task& task = scheduler.getTask(idx);

                if (!task.hasFixedAllocation())
                    next.server_indices[idx] = rand() % serverCount;

                next.priorities[idx] = static_cast<double>(rand()) / RAND_MAX;
            }

            if (scheduler.schedule(next)) {
                nextSpan = scheduler.getScheduleSpan();
                hasFeasibleNeighbor = true;
            }
        }

        if (!hasFeasibleNeighbor) {
            // no feasible neighbor found at this T — keep cooling
            T *= alpha;
            continue;
        }

        // -----------------------------------------------------
        // Accept / reject rule
        // -----------------------------------------------------
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

        T *= alpha;
    }

    // ---------------------------------------------------------
    // 3) Final scheduling with best solution found
    // ---------------------------------------------------------
    if (bestSpan < INT_MAX)
        scheduler.schedule(best);
    else
        utils::dbg << "SA: No feasible solution found.\n";
}


void Solver::solve(SolverMethod method) {
    switch(method) {
        case SolverMethod::RANDOM_SEARCH:
            randomSearchSolve();
            break;
        case SolverMethod::GENETIC_ALGORITHM:
            geneticAlgorithmSolve();
            break;
        case SolverMethod::SIMULATED_ANNEALING:
            simulatedAnnealingSolve();
            break;
        default:
            utils::dbg << "Unknown solver method.\n";
            break;
    }
}