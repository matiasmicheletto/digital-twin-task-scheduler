#include "solver.h"

Candidate Solver::solve() {
    switch(config.solverMethod) {
        case SolverMethod::RANDOM_SEARCH:
            return randomSearchSolve();
        case SolverMethod::GENETIC_ALGORITHM:
            return geneticAlgorithmSolve();
        case SolverMethod::SIMULATED_ANNEALING:
            return simulatedAnnealingSolve();
        default:
            utils::dbg << "Unknown solver method.\n";
            return Candidate(scheduler.getTaskCount());
    }
}