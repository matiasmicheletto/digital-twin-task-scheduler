#include "solver.h"

SolverResult Solver::randomSearchSolve() {
    // Performs random search to find a feasible scheduling solution

    SolverResult results(
        SolverResult::SolverStatus::NOT_STARTED,
        scheduler.getInstanceName(),
        SolverMethod::RANDOM_SEARCH,
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

    int maxIterations = config.rs_maxIterations;
    bool breakOnFirstFeasible = config.rs_breakOnFirstFeasible;
    int timeout = config.rs_timeout;

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
    results.status = SolverResult::SolverStatus::COMPLETED; // Default to completed unless timeout or stagnation occurs
    for (iteration = 0; iteration < maxIterations; ++iteration) {

        // timeout check
        if(utils::getElapsedMs(startTime) >= timeout) {
            results.status = SolverResult::SolverStatus::TIMEOUT;
            results.observations = "GA: Timeout reached after " + std::to_string(timeout) + " seconds.";
            utils::dbg << results.observations << "\n";
            break;
        }

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
            if (improvement < config.rs_stagnationThreshold) {
                nonImprovingGenerations++;
                if (nonImprovingGenerations >= config.rs_stagnationLimit) {
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
        results.status = SolverResult::SolverStatus::ERROR;
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