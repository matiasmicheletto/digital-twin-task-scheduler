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

std::string Solver::getSolverMethodName() const {
    switch(config.solverMethod) {
        case SolverMethod::RANDOM_SEARCH:
            return "Random Search";
        case SolverMethod::GENETIC_ALGORITHM:
            return "Genetic Algorithm";
        case SolverMethod::SIMULATED_ANNEALING:
            return "Simulated Annealing";
        default:
            return "Unknown Method";
    }
}

void Solver::writeLog(int runtime, int iterations, int scheduleSpan, int finishTimeSum, ScheduleState state, std::string obs) {
    // Prints optimization results in csv format to the log stream
    std::string timestamp = utils::currentDateTime();
    std::string instanceName = scheduler.getInstanceName();
    std::string solverMethodName;
    switch(config.solverMethod) {
        case SolverMethod::RANDOM_SEARCH:
            solverMethodName = "Random Search";
            break;
        case SolverMethod::GENETIC_ALGORITHM:
            solverMethodName = "Genetic Algorithm";
            break;
        case SolverMethod::SIMULATED_ANNEALING:
            solverMethodName = "Simulated Annealing";
            break;
        default:
            solverMethodName = "Unknown Method";
    }

    std::string scheduleStateStr = scheduler.printScheduleState();

    log << timestamp << "," 
        << instanceName << "," 
        << solverMethodName << "," 
        << runtime << "," 
        << iterations << "," 
        << scheduleSpan << "," 
        << finishTimeSum << "," 
        << scheduleStateStr << (obs.empty() ? "" : ("," + obs))
        << "\n";
}