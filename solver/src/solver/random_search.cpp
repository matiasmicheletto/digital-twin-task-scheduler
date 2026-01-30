#include "solver.h"

SolverResult Solver::randomSearchSolve() {
    // Performs random search to find a feasible scheduling solution

    const int maxIterations          = config.rs_maxIterations;
    const bool breakOnFirstFeasible  = config.rs_breakOnFirstFeasible;
    const int timeoutMs              = config.rs_timeout_sec * 1000;
    const int stagnationLimit        = config.rs_stagnationLimit;
    const double stagnationThreshold = config.rs_stagnationThreshold;

    SolverResult results(
        SolverResult::SolverStatus::NOT_STARTED,
        scheduler.getInstanceName(),
        SolverMethod::RANDOM_SEARCH,
        PriorityRefinementMethod::NORMAL_PERTURBATION, // (not used in random search)
        ScheduleState::NOT_SCHEDULED,
        Candidate(scheduler.getTaskCount()),
        config.alpha,
        config.beta,
        config.gamma,
        0,
        0,
        0,
        0,
        0,
        0,
        ""
    );

    auto startTime = std::chrono::high_resolution_clock::now();

    int bestFitness = INT_MAX;
    Candidate curr(scheduler.getTaskCount());
    Candidate best(scheduler.getTaskCount());
    
    const size_t allocable_servers_count = scheduler.getNonMISTServerCount();
    if(allocable_servers_count == 0) {
        results.status = SolverResult::SolverStatus::ERROR;
        results.observations = "No allocable servers available.";
        utils::dbg << results.observations << "\n";
        return results;
    }

    double improvement = 0.0;
    int nonImprovingGenerations = 0;
    int iteration;
    results.status = SolverResult::SolverStatus::COMPLETED; // Default to completed unless timeoutMs or stagnation occurs
    for (iteration = 0; iteration < maxIterations; ++iteration) {

        // timeoutMs check
        if(utils::getElapsedMs(startTime) >= timeoutMs) {
            results.status = SolverResult::SolverStatus::TIMEOUT;
            results.observations = "GA: Timeout reached after " + std::to_string(timeoutMs) + " seconds.";
            utils::dbg << results.observations << "\n";
            break;
        }

        for (size_t i = 0; i <  scheduler.getTaskCount(); ++i) {
            // Check if task has fixed allocation
            const Task& task = scheduler.getTask(i);
            if (!task.hasFixedAllocation()){
                //curr.server_indices[i] = rand() % scheduler.getServerCount(); // Random server assignment
                curr.server_indices[i] = scheduler.getNonMISTServerIdx(rand() % allocable_servers_count);
                continue; // Priority doesnt matter for fixed allocation tasks
            }
            // Random priority between 0 and 1
            // Optimization algorithms do not need to clamp priorities values (outside [0,1]) as allocation work with relative values
            curr.priorities[i] = static_cast<double>(rand()) / RAND_MAX; 
        }

        // Schedule using the generated candidate
        if (scheduler.schedule(curr) == ScheduleState::SCHEDULED) { // feasible
            if (breakOnFirstFeasible) { // Only matters the best
                results.status = SolverResult::SolverStatus::COMPLETED;
                results.observations = "Feasible solution found after " + std::to_string(iteration + 1) + " iterations.";
                results.bestCandidate = curr;
                utils::dbg << results.observations << "\n";
                return results;
            }
            // Check if this is the best solution found so far
            //int fitness = scheduler.getScheduleSpan();
            int fitness = computeObjective();
            if (fitness < bestFitness) {
                bestFitness = fitness;
                best = curr;
                improvement = bestFitness - fitness;
                nonImprovingGenerations = 0;
            } else {
                improvement = 0.0;
            }

            // Stagnation check
            if (improvement < stagnationThreshold) {
                nonImprovingGenerations++;
                if (nonImprovingGenerations >= stagnationLimit) {
                    results.status = SolverResult::SolverStatus::STAGNATION;
                    results.observations = "Random Search: Stagnation reached after " + std::to_string(nonImprovingGenerations) + " iterations without improvement.";
                    utils::dbg << results.observations << "\n";
                    break;
                }
            }
        }
    }

    // Final scheduling with the best candidate found
    if (scheduler.schedule(best) != ScheduleState::SCHEDULED) {
        results.status = SolverResult::SolverStatus::SOLUTION_NOT_FOUND;
        results.observations = "No feasible solution found after " + std::to_string(maxIterations) + " iterations.";
        utils::dbg << results.observations << "\n";
    }else{
        results.runtime_ms = utils::getElapsedMs(startTime);
        results.iterations = iteration;
        results.scheduleSpan = scheduler.getScheduleSpan();
        results.finishTimeSum = scheduler.getFinishTimeSum();
        results.processorsCost = scheduler.getProcessorsCost();
        results.delayCost = scheduler.getDelayCost();
        results.scheduleState = scheduler.getScheduleState();
        results.bestCandidate = best;
    }

    return results;
}