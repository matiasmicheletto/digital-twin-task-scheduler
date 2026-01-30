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
                     + config.beta * static_cast<double>(delay_cost)
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
        (*config.log) << result.print(utils::PRINT_FORMAT::CSV);
    }else{
        std::cout << "No log stream defined in SolverConfig; skipping CSV log output.\n\n\n";
    }
    
    return result;
};
