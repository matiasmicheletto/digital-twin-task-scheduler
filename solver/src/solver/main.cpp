#include "solver.h"

Candidate Solver::solve() {
    srand(static_cast<unsigned int>(time(nullptr)));
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