#include "solver.h"

SolverResult Solver::randomSearchSolve() {
    // Performs random search to find a feasible scheduling solution

    const int maxIterations          = config.rs_maxIterations;
    const bool breakOnFirstFeasible  = config.rs_breakOnFirstFeasible;
    const int timeoutMs              = config.rs_timeout_sec * 1000;
    const int stagnationLimit        = config.rs_stagnationLimit;
    const double perturbationRate    = config.rs_perturbationRate;
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
    Candidate curr = scheduler.getCandidateFromCurrentSchedule();
    Candidate best(scheduler.getTaskCount());
    
    if(scheduler.getNonMISTServerCount() == 0) {
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

        // Schedule may be already initialized before entering the loop (e.g., from an initial solution)
        // So, best fitness check must be done here as well
        if (scheduler.getScheduleState() == ScheduleState::SCHEDULED) { // feasible
            if (breakOnFirstFeasible) { // Used to initialize other solvers with a quick feasible solution
                results.status = SolverResult::SolverStatus::COMPLETED;
                results.observations = "Feasible solution found after " + std::to_string(iteration + 1) + " iterations.";
                results.bestCandidate = curr;
                results.runtime_ms = utils::getElapsedMs(startTime);
                results.iterations = iteration + 1;
                results.scheduleSpan = scheduler.getScheduleSpan();
                results.finishTimeSum = scheduler.getFinishTimeSum();
                results.processorsCost = scheduler.getProcessorsCost();
                results.delayCost = scheduler.getDelayCost();
                results.scheduleState = scheduler.getScheduleState();
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

        randomizeCandidate(curr, perturbationRate);

        scheduler.schedule(curr); // try to schedule current candidate
    }

    // Final scheduling with the best candidate found
    if (scheduler.schedule(best) != ScheduleState::SCHEDULED) {
        results.status = SolverResult::SolverStatus::SOLUTION_NOT_FOUND;
        results.observations = "No feasible solution found after " + std::to_string(iteration) + " iterations.";
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