#include "solver.h"

SolverResult Solver::simulatedAnnealingSolve() {
    // Parameters from config
    const int maxInitTries        = config.sa_maxInitTries;
    const int maxIterations       = config.sa_maxIterations;
    const int maxNeighborTries    = config.sa_maxNeighborTries;
    const double initialTemperature = config.sa_initialTemperature;
    const double coolingRate      = config.sa_coolingRate;
    const double minTemperature   = config.sa_minTemperature;
    const int timeout            = config.sa_timeout;
    const int stagnationLimit      = config.sa_stagnationLimit;
    const double stagnationThreshold = config.sa_stagnationThreshold;

    SolverResult results(
        SolverResult::SolverStatus::NOT_STARTED,
        scheduler.getInstanceName(),
        SolverMethod::SIMULATED_ANNEALING,
        ScheduleState::NOT_SCHEDULED,
        Candidate(scheduler.getTaskCount()),
        0,
        0,
        0,
        0,
        0,
        0,
        ""
    );

    auto startTime = std::chrono::high_resolution_clock::now();

    // Initialize using random search to find an initial feasible solution
    config.rs_breakOnFirstFeasible = true;
    config.rs_maxIterations = maxInitTries;
    SolverResult rsResult = randomSearchSolve();
    if (scheduler.getScheduleState() != ScheduleState::SCHEDULED) {
        results.status = SolverResult::SolverStatus::ERROR;
        results.observations = "SA: Could not find initial feasible solution";
        utils::dbg << results.observations << "\n";
        return results;
    }

    //int currFitness = scheduler.getScheduleSpan();
    int currFitness = computeObjective();
    Candidate best = rsResult.bestCandidate;
    Candidate curr = rsResult.bestCandidate;
    Candidate next(scheduler.getTaskCount());
    int bestFitness = currFitness;
    const size_t allocable_servers_count = scheduler.getNonMISTServerCount();
    double T = initialTemperature;

    double improvement = 0.0;
    int nonImprovingIterations = 0;
    int iteration;
    results.status = SolverResult::SolverStatus::COMPLETED; // Default to completed unless timeout or stagnation occurs

    for (iteration = 0; iteration < maxIterations && T > minTemperature; ++iteration) {

        // timeout check
        if(utils::getElapsedMs(startTime) >= timeout) {
            results.status = SolverResult::SolverStatus::TIMEOUT;
            results.observations = "GA: Timeout reached after " + std::to_string(timeout) + " seconds.";
            utils::dbg << results.observations << "\n";
            break;
        }

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

                if (!task.hasFixedAllocation()){
                    //next.server_indices[idx] = rand() % scheduler.getServerCount();
                    curr.server_indices[idx] = scheduler.getNonMISTServerIdx(rand() % allocable_servers_count);
                }
                next.priorities[idx] = static_cast<double>(rand()) / RAND_MAX;
            }

            if (scheduler.schedule(next) == ScheduleState::SCHEDULED) { // schedule() is expensive, so only call it once per neighbor
                nextFitness = computeObjective();
                hasFeasibleNeighbor = true; // found a feasible neighbor, exit inner loop
                if (nextFitness < currFitness){
                    break; // improvement found — stop searching
                }
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
                improvement = bestFitness - currFitness;
                nonImprovingIterations = 0;
            }else{
                improvement = 0.0;
            }

            // Stagnation check
            if (improvement < stagnationThreshold) {
                nonImprovingIterations++;
                if (nonImprovingIterations >= stagnationLimit) {
                    results.status = SolverResult::SolverStatus::STAGNATION;
                    results.observations = "SA: Stagnation reached after " + std::to_string(nonImprovingIterations) + " iterations without improvement.";
                    utils::dbg << results.observations << "\n";
                    break;
                }
            }
        }

        T *= coolingRate;
    }

    if (bestFitness < INT_MAX){
        scheduler.schedule(best);
        results.scheduleState = scheduler.getScheduleState();
        results.bestCandidate = best;
        results.runtime_ms = utils::getElapsedMs(startTime);
        results.iterations = iteration;
        results.scheduleSpan = scheduler.getScheduleSpan();
        results.finishTimeSum = scheduler.getFinishTimeSum();
        results.processorsCost = scheduler.getProcessorsCost();
        results.delayCost = scheduler.getDelayCost();
    }else{
        results.status = SolverResult::SolverStatus::ERROR;
        results.observations = "SA: No feasible solution found.";
        utils::dbg << results.observations << "\n";
    }

    return results;
}