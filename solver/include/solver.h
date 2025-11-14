#ifndef SOLVER_H
#define SOLVER_H

#include "scheduler.h"

enum class SolverMethod {
    RANDOM_SEARCH,
    GENETIC_ALGORITHM
};

class Solver {
public:
    Solver(Scheduler& sch) : scheduler(sch) {}

    void solve(SolverMethod method = SolverMethod::RANDOM_SEARCH);

private: 
    Scheduler& scheduler;
    void randomSearchSolve();
    void geneticAlgorithmSolve();
};


#endif // SOLVER_H