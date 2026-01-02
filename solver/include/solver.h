#ifndef SOLVER_H
#define SOLVER_H

#include <yaml-cpp/yaml.h>
#include "utils.h"
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
    int sa_timeout = 3600;
    int sa_stagnationLimit = 200; // Number of iterations without improvement before stopping
    int sa_maxNeighborTries = 20;
    double sa_initialTemperature = 100.0;
    double sa_coolingRate = 0.995;
    double sa_minTemperature = 1e-3;
    // Refinement parameters
    double sa_sigmaMax = 0.1; // Maximum standard deviation for priority refinement (use smaller values for finer adjustments)
    int sa_refinementIterations = 50;
    int sa_pso_swarmSize = 30;
    int sa_pso_velocityClamp = 2;
    double sa_pso_inertiaWeight = 0.5;
    double sa_pso_cognitiveCoefficient = 1.5;
    double sa_pso_socialCoefficient = 1.5;

    // Parameters for Random Search
    int rs_maxIterations = 1000;
    int rs_timeout = 3600;
    int rs_stagnationLimit = 200;
    bool rs_breakOnFirstFeasible = false;

    // Parameters for Genetic Algorithm
    int ga_populationSize = 100;
    int ga_maxGenerations = 500;
    int ga_timeout = 3600;
    int ga_eliteCount = 5;
    int ga_stagnationLimit = 50;
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

    void refinePrioritiesNormal(Candidate& curr, int currFitness, double T);
    void refinePrioritiesPSO(Candidate& curr, int currFitness, double T);
    void refinePriorities(PriorityRefinementMethod refinementMethod, Candidate& curr, int currFitness, double T);
};


#endif // SOLVER_H