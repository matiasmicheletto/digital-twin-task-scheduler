#ifndef SOLVER_H
#define SOLVER_H

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

class Solver {
public:
    Solver(Scheduler& sch) : scheduler(sch) {}

    // TODO: pass parameters to configure each method
    Candidate solve(SolverMethod method = SolverMethod::RANDOM_SEARCH);

private: 
    Scheduler& scheduler;
    Candidate randomSearchSolve(int maxIterations = 1000, bool breakOnFirstFeasible = false);
    Candidate geneticAlgorithmSolve();
    Candidate simulatedAnnealingSolve(int maxInitTries = 3000, int maxIters = 3000, int maxNeighborTries = 20, double initialTemperature = 100.0, double coolingRate = 0.995, double minTemperature = 1e-3);

    bool refinePriorities(PriorityRefinementMethod refinementMethod, Candidate& c, double T);
};


#endif // SOLVER_H