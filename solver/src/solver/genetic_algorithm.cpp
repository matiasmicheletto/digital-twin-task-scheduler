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
            if (!scheduler.getTask(i).hasFixedAllocation())
                c.server_indices[i] = rand() % scheduler.getServerCount();
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

Candidate Solver::geneticAlgorithmSolve() {
    
    const int maxInitTries = config.ga_maxInitTries;
    const int populationSize = config.ga_populationSize;
    const int maxGenerations = config.ga_maxGenerations;
    const double mutationRate = config.ga_mutationRate;
    const double crossoverRate = config.ga_crossoverRate;
    const int timeout = config.ga_timeout;
    const int eliteCount = config.ga_eliteCount;

    

    // Initialize population
    std::vector<Individual> population;
    config.rs_breakOnFirstFeasible = true;
    config.rs_maxIterations = maxInitTries;
    for (int i = 0; i < populationSize; ++i) {
        Candidate candidate = randomSearchSolve();
        if (scheduler.isScheduled()) {
            population.emplace_back(candidate, scheduler.getFinishTimeSum());
        }
    }

    // Check if all individuals are feasible
    if (population.size() < populationSize / 2) {
        utils::dbg << "GA: Could not initialize a sufficient feasible population.\n";
        return Candidate(scheduler.getTaskCount());
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
    auto startTime = std::chrono::steady_clock::now();
    for (int generation = 0; generation < maxGenerations; ++generation) {
        // timeout check
        auto now = std::chrono::steady_clock::now();
        if(std::chrono::duration_cast<std::chrono::seconds>(now - startTime).count() >= timeout) {
            utils::dbg << "GA: Timeout reached after " << timeout << " seconds.\n";
            break;
        }

        std::vector<Individual> newPopulation;

        // Elitism: carry over the best individuals
        for (int i = 0; i < eliteCount && i < population.size(); ++i) {
            newPopulation.push_back(population[i]);
        }

        // Generate new individuals
        while ((int)newPopulation.size() < populationSize) {
            const auto& p1 = tournamentSelect();
            const auto& p2 = tournamentSelect();

            Candidate child = p1.candidate;

            if (rand() / (double)RAND_MAX < crossoverRate) {
                child = crossover(scheduler, p1.candidate, p2.candidate);
            }

            mutate(scheduler, mutationRate, child);

            if (scheduler.schedule(child)) {
                int fitness = scheduler.getFinishTimeSum();
                newPopulation.push_back({child, fitness});
            }
        }

        population = std::move(newPopulation);
        std::sort(population.begin(), population.end(), sortByFitness);

        if(population.front().fitness < best.fitness) {
            best = population.front();
        }
    }

    scheduler.schedule(best.candidate);
    return best.candidate;
}