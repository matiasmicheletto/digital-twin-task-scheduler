#include "solver.h"

struct Individual {
    Candidate candidate;
    int fitness;
    Individual(const Candidate& candidate, int fit) : candidate(candidate), fitness(fit) {}
};

auto sortByFitness = [](const Individual& a, const Individual& b) {
    return a.fitness < b.fitness;
};

Candidate crossover(Scheduler& scheduler, const Candidate& p1, const Candidate& p2) {
    Candidate child = p1;
    for (size_t i = 0; i < scheduler.getTaskCount(); ++i) {
        if (rand() / (double)RAND_MAX < 0.5) {
            child.server_indices[i] = p2.server_indices[i];
        }
        child.priorities[i] =
            0.5 * p1.priorities[i] + 0.5 * p2.priorities[i];
    }
    return child;
};

SolverResult Solver::geneticAlgorithmSolve() {
    
    const int maxInitTries           = config.ga_maxInitTries;
    const size_t populationSize      = config.ga_populationSize;
    const int maxGenerations         = config.ga_maxGenerations;
    const double mutationRate        = config.ga_mutationRate;
    const double crossoverRate       = config.ga_crossoverRate;
    const int timeoutMs              = config.ga_timeout_sec*1000;
    const int stagnationLimit        = config.ga_stagnationLimit;
    const double stagnationThreshold = config.ga_stagnationThreshold;
    const size_t eliteCount          = config.ga_eliteCount;

    SolverResult results(
        SolverResult::SolverStatus::NOT_STARTED,
        scheduler.getInstanceName(),
        SolverMethod::GENETIC_ALGORITHM,
        PriorityRefinementMethod::NORMAL_PERTURBATION, // (not used in GA)
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
        0,
        ""
    );

    auto startTime = std::chrono::high_resolution_clock::now();

    // Initialize population
    std::vector<Individual> population;
    config.rs_breakOnFirstFeasible = true;
    config.rs_maxIterations = maxInitTries;
    for (size_t i = 0; i < populationSize; ++i) {
        SolverResult rsResults = randomSearchSolve();
        if (scheduler.getScheduleState() == ScheduleState::SCHEDULED) {
            population.emplace_back(rsResults.bestCandidate, computeObjective());
        }else{
            results.status = SolverResult::SolverStatus::ERROR;
            results.observations = "GA: Individual " + std::to_string(i + 1) + "/" + std::to_string(populationSize) + " infeasible during initialization after " + std::to_string(maxInitTries) + " tries.";
            utils::dbg << results.observations << "\n";
            return results;
        }
    }

    // Check if all individuals are feasible
    if (population.size() < populationSize / 2) {
        results.status = SolverResult::SolverStatus::INITIALIZATION_NOT_FEASIBLE;
        results.observations = "Could not initialize a sufficient feasible population";
        utils::dbg << results.observations << "\n";
        return results;
    }

    // Sort initial population by fitness
    std::sort(population.begin(), population.end(), sortByFitness);
    Individual best = population.front();
    Scheduler bestScheduler = scheduler; // Snapshot when best was last confirmed feasible
    bool foundFeasible = true; // Population was just initialized with feasible individuals

    // Tournament
    auto tournamentSelect = [&](int k = 3) -> const Individual& {
        int bestIdx = rand() % population.size();
        for (int i = 1; i < k; ++i) {
            int idx = rand() % population.size();
            if (population[idx].fitness < population[bestIdx].fitness)
                bestIdx = idx;
        }
        return population[bestIdx];
    };

    // GA main loop
    int iterations = 0;
    double improvement = 0.0;
    int nonImprovingGenerations = 0;
    results.status = SolverResult::SolverStatus::COMPLETED; // Default to completed unless timeoutMs or stagnation occurs
    for (int generation = 0; generation < maxGenerations; ++generation) {
        
        // timeoutMs check
        if(utils::getElapsedMs(startTime) >= timeoutMs) {
            results.status = SolverResult::SolverStatus::TIMEOUT;
            results.observations = "GA: Timeout reached after " + std::to_string(timeoutMs) + " seconds.";
            utils::dbg << results.observations << "\n";
            break;
        }

        std::vector<Individual> newPopulation;

        // Elitism: carry over the best individuals
        for (size_t i = 0; i < eliteCount && i < population.size(); ++i) {
            newPopulation.push_back(population[i]);
        }

        // Generate new individuals
        while (newPopulation.size() < populationSize) {
            const auto& p1 = tournamentSelect();
            const auto& p2 = tournamentSelect();

            Candidate child = p1.candidate;

            if (rand() / (double)RAND_MAX < crossoverRate) {
                child = crossover(scheduler, p1.candidate, p2.candidate);
            }

            randomizeCandidate(child, mutationRate); // Mutation

            if (scheduler.schedule(child) == ScheduleState::SCHEDULED) {
                int fitness = computeObjective();
                newPopulation.push_back({child, fitness});
            } else {
                // If child is infeasible, keep one of the parents (elitism)
                newPopulation.push_back(p1);
            }

            iterations++;
        }

        population = std::move(newPopulation);
        std::sort(population.begin(), population.end(), sortByFitness);

        if(population.front().fitness < best.fitness) {
            improvement = best.fitness - population.front().fitness; // compute before updating best
            best = population.front();
            // Save scheduler snapshot when best is updated (re-schedule to capture the state)
            if (scheduler.schedule(best.candidate) == ScheduleState::SCHEDULED) {
                bestScheduler = scheduler;
            }
            nonImprovingGenerations = 0;
        } else {
            improvement = 0.0;
        }

        // Stagnation check
        if (improvement < stagnationThreshold) {
            nonImprovingGenerations++;
            if (nonImprovingGenerations >= stagnationLimit) {
                results.status = SolverResult::SolverStatus::STAGNATION;
                results.observations = "GA: Stagnation reached after " + std::to_string(nonImprovingGenerations) + " generations without improvement.";
                utils::dbg << results.observations << "\n";
                break;
            }
        }
    }

    if (scheduler.schedule(best.candidate) != ScheduleState::SCHEDULED) {
        // Re-scheduling the best candidate failed. If we saved a valid snapshot, restore it.
        if (foundFeasible) {
            scheduler = bestScheduler;
            results.observations = "GA: Best candidate could not be re-scheduled; returning best known state.";
            utils::dbg << results.observations << "\n";
        } else {
            results.observations = "GA: Best candidate infeasible at the end.";
            utils::dbg << results.observations << "\n";
            return results;
        }
    }
    results.scheduleState = scheduler.getScheduleState();
    results.bestCandidate = best.candidate;
    results.runtime_ms = utils::getElapsedMs(startTime);
    results.iterations = iterations;
    results.scheduleSpan = scheduler.getScheduleSpan();
    results.finishTimeSum = scheduler.getFinishTimeSum();
    results.processorsCost = scheduler.getProcessorsCost();
    results.delayCost = scheduler.getDelayCost();
    results.memoryUsageKB = utils::getPeakMemoryUsageKB();

    return results;
}