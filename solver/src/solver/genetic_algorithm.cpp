#include "solver.h"

struct Individual {
    Candidate candidate;
    int fitness;
    Individual(const Candidate& candidate, int fit) : candidate(candidate), fitness(fit) {}
};

auto sortByFitness = [](const Individual& a, const Individual& b) {
    return a.fitness < b.fitness;
};

void mutate(Scheduler& scheduler, double mutationRate, Candidate& c) {
    for (size_t i = 0; i < scheduler.getTaskCount(); ++i) {
        if (rand() / (double)RAND_MAX < mutationRate) {
            if (!scheduler.getTask(i).hasFixedAllocation()){
                //c.server_indices[i] = rand() % scheduler.getServerCount();
                c.server_indices[i] = scheduler.getNonMISTServerIdx(rand() % scheduler.getNonMISTServerCount());
            }
        }
        if (rand() / (double)RAND_MAX < mutationRate) {
            c.priorities[i] += utils::randNormal(0, 0.05);
            c.priorities[i] = utils::clamp(c.priorities[i], 0.0, 1.0);
        }
    }
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

            mutate(scheduler, mutationRate, child);

            if (scheduler.schedule(child) == ScheduleState::SCHEDULED) {
                int fitness = computeObjective();
                newPopulation.push_back({child, fitness});
            }

            iterations++;
        }

        population = std::move(newPopulation);
        std::sort(population.begin(), population.end(), sortByFitness);

        if(population.front().fitness < best.fitness) {
            best = population.front();
            improvement = best.fitness - population.front().fitness;
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

    scheduler.schedule(best.candidate);
    results.scheduleState = scheduler.getScheduleState();
    if(results.scheduleState == ScheduleState::SCHEDULED) {
        results.bestCandidate = best.candidate;
        results.runtime_ms = utils::getElapsedMs(startTime);
        results.iterations = iterations;
        results.scheduleSpan = scheduler.getScheduleSpan();
        results.finishTimeSum = scheduler.getFinishTimeSum();
        results.processorsCost = scheduler.getProcessorsCost();
        results.delayCost = scheduler.getDelayCost();
        utils::dbg << results.observations << "\n";
        return results;
    }else{
        results.observations = "GA: Best candidate infeasible at the end.";
        utils::dbg << results.observations << "\n";
        return results;
    }

    return results;
}