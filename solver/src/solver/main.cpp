#include "solver.h"

double Solver::computeObjective() const {
    if (scheduler.getScheduleState() != ScheduleState::SCHEDULED) {
        utils::dbg << "Schedule not computed yet.\n";
        return -1.0;
    }
    //int schedule_span = scheduler.getScheduleSpan();
    int finish_time_sum = scheduler.getFinishTimeSum();
    int processors_cost = scheduler.getProcessorsCost();
    int delay_cost = scheduler.getDelayCost();

    double objective = config.alpha * static_cast<double>(finish_time_sum)
                     + config.beta * delay_cost
                     + config.gamma * static_cast<double>(processors_cost);
    return objective;
};

SolverResult Solver::solve() {
    srand(static_cast<unsigned int>(time(nullptr)));
    SolverResult result;
    switch(config.solverMethod) {
        case SolverMethod::RANDOM_SEARCH:
            result = randomSearchSolve();
            break;
        case SolverMethod::GENETIC_ALGORITHM:
            result =  geneticAlgorithmSolve();
            break;
        case SolverMethod::SIMULATED_ANNEALING:
            result =  simulatedAnnealingSolve();
            break;
        default:
            utils::dbg << "Unknown solver method.\n";
            result.status = SolverResult::SolverStatus::ERROR;
            return result;
    }
    // Write CSV log output (separated to avoid potential optimization issues)
    if (config.log) {
        std::string csv_output = result.print(utils::PRINT_FORMAT::CSV);
        (*config.log) << csv_output;
    }else{
        utils::dbg << "No log stream defined in SolverConfig; skipping CSV log output.\n";
        exit(1);
    }
    return result;
};

std::string Solver::getSolverMethodName() const {
    return ::solverMethodToString(config.solverMethod);
};