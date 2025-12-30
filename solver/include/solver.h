#ifndef SOLVER_H
#define SOLVER_H

#include <yaml-cpp/yaml.h>
#include "scheduler.h"

enum class SolverMethod {
    RANDOM_SEARCH,
    GENETIC_ALGORITHM,
    SIMULATED_ANNEALING
};

enum class PriorityRefinementMethod {
    NORMAL_PERTURBATION,
    PARTICLE_SWARM_OPTIMIZATION
};

class SolverConfig { // Configuration parameters for the solver
public:
    SolverMethod solverMethod = SolverMethod::RANDOM_SEARCH;
    PriorityRefinementMethod priorityRefinementMethod = PriorityRefinementMethod::NORMAL_PERTURBATION;

    // Parameters for Simulated Annealing
    int sa_maxInitTries = 3000;
    int sa_maxIterations = 3000;
    int sa_maxNeighborTries = 20;
    double sa_initialTemperature = 100.0;
    double sa_coolingRate = 0.995;
    double sa_minTemperature = 1e-3;

    // Parameters for Random Search
    int rs_maxIterations = 1000;
    bool rs_breakOnFirstFeasible = false;

    // Parameters for Genetic Algorithm
    int ga_populationSize = 100;
    int ga_maxGenerations = 500;
    double ga_mutationRate = 0.1;
    double ga_crossoverRate = 0.7;

    static SolverConfig fromYaml(const std::string& file_path);

    void print() const;
};

class Solver {
public:
    Solver(Scheduler& sch, SolverConfig& config) : scheduler(sch), config(config) {}

    Candidate solve();

private: 
    Scheduler& scheduler;    
    SolverConfig& config;
    
    Candidate randomSearchSolve();
    Candidate geneticAlgorithmSolve();
    Candidate simulatedAnnealingSolve();

    bool refinePriorities(PriorityRefinementMethod refinementMethod, Candidate& c, double T);
};


#endif // SOLVER_H