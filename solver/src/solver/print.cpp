#include "solver.h"

std::string solverMethodToString(SolverMethod method) {
    switch(method) {
        case SolverMethod::RANDOM_SEARCH:
            return "Random Search";
        case SolverMethod::GENETIC_ALGORITHM:
            return "Genetic Algorithm";
        case SolverMethod::SIMULATED_ANNEALING:
            return "Simulated Annealing";
        default:
            return "Unknown Method";
    }
};

std::string SolverConfig::print() const {
    std::ostringstream oss;

    oss << "Solver Configuration:\n";
    oss << "  Solver Method: ";
    switch (solverMethod) {
        case SolverMethod::RANDOM_SEARCH:
            oss << "RANDOM_SEARCH\n";
            oss << "  Parameters:\n";
            oss << "    max_iterations: " << rs_maxIterations << "\n";
            oss << "    timeout: " << rs_timeout << "\n";
            oss << "    stagnation_threshold: " << rs_stagnationThreshold << "\n";
            oss << "    stagnation_limit: " << rs_stagnationLimit << "\n";
            oss << "    break_on_first_feasible: " << (rs_breakOnFirstFeasible ? "true" : "false") << "\n";
            break;

        case SolverMethod::SIMULATED_ANNEALING:
            oss << "SIMULATED_ANNEALING\n";
            oss << "  Parameters:\n";
            oss << "    max_init_tries: " << sa_maxInitTries << "\n";
            oss << "    max_iterations: " << sa_maxIterations << "\n";
            oss << "    timeout: " << sa_timeout << "\n";
            oss << "    stagnation_threshold: " << sa_stagnationThreshold << "\n";
            oss << "    stagnation_limit: " << sa_stagnationLimit << "\n";
            oss << "    max_neighbor_tries: " << sa_maxNeighborTries << "\n";
            oss << "    initial_temperature: " << sa_initialTemperature << "\n";
            oss << "    cooling_rate: " << sa_coolingRate << "\n";
            oss << "    min_temperature: " << sa_minTemperature << "\n";
            oss << "  Priority Refinement Method: ";
            switch (sa_priorityRefinementMethod) {
                case PriorityRefinementMethod::NORMAL_PERTURBATION:
                    oss << "NORMAL_PERTURBATION\n";
                    break;
                case PriorityRefinementMethod::PARTICLE_SWARM_OPTIMIZATION:
                    oss << "PARTICLE_SWARM_OPTIMIZATION\n";
                    break;
            }
            oss << "    sigma_max: " << sa_sigmaMax << "\n";
            oss << "    refinement_iterations: " << sa_refinementIterations << "\n";
            oss << "    pso_swarm_size: " << sa_pso_swarmSize << "\n";
            oss << "    refinement_pso_velocity_clamp: " << sa_pso_velocityClamp << "\n";
            oss << "    refinement_pso_inertia_weight: " << sa_pso_inertiaWeight << "\n";
            oss << "    pso_cognitive_coefficient: " << sa_pso_cognitiveCoefficient << "\n";
            oss << "    pso_social_coefficient: " << sa_pso_socialCoefficient << "\n";
            break;

        case SolverMethod::GENETIC_ALGORITHM:
            oss << "GENETIC_ALGORITHM\n";
            oss << "  Parameters:\n";
            oss << "    population_size: " << ga_populationSize << "\n";
            oss << "    max_generations: " << ga_maxGenerations << "\n";
            oss << "    timeout: " << ga_timeout << "\n";
            oss << "    stagnation_threshold: " << ga_stagnationThreshold << "\n";
            oss << "    elite_count: " << ga_eliteCount << "\n";
            oss << "    stagnation_limit: " << ga_stagnationLimit << "\n";
            oss << "    mutation_rate: " << ga_mutationRate << "\n";
            oss << "    crossover_rate: " << ga_crossoverRate << "\n";
            break;
    }

    return oss.str();
}  


std::string SolverResult::printCSV() const {
    std::ostringstream oss;

    oss << utils::currentDateTime() << ",";
    oss << instanceName << ",";
    oss << solverMethodToString(usedMethod) << ",";
    oss << runtime_ms << ",";
    oss << iterations << ",";
    oss << scheduleSpan << ",";
    oss << finishTimeSum << ",";
    oss << processorsCost << ",";
    oss << delayCost << ",";
    oss << scheduleState.toString() << "\n";

    return oss.str();
};

std::string SolverResult::printTxt() const {
    std::ostringstream oss;
    oss << "Solver Results:\n";
    oss << "  Solver Method: " << solverMethodToString(usedMethod) << "\n";

    oss << "  Instance Name: " << instanceName << "\n";
    oss << "  Status: ";
    switch (status) {
        case SolverStatus::NOT_STARTED:
            oss << "Not Started\n";
            break;
        case SolverStatus::COMPLETED:
            oss << "Completed\n";
            break;
        case SolverStatus::TIMEOUT:
            oss << "Timeout\n";
            break;
        case SolverStatus::STAGNATION:
            oss << "Stagnation\n";
            break;
        case SolverStatus::ERROR:
            oss << "Error\n";
            break;
        default:
            oss << "Unknown Status\n";
            break;
    }
    if (scheduleState == ScheduleState::SCHEDULED) {
        oss << "  Runtime (ms): " << runtime_ms << "\n";
        oss << "  Iterations: " << iterations << "\n";
        oss << "  Schedule Span: " << scheduleSpan << "\n";
        oss << "  Finish Time Sum: " << finishTimeSum << "\n";
        oss << "  Processors Cost: " << processorsCost << "\n";
        oss << "  Delay Cost: " << delayCost << "\n";
        oss << "  Schedule State: " << scheduleState.toString() << "\n";
        oss << "  Best candidate:\n";
        oss << bestCandidate.print();
    }
    
    return oss.str();
};

std::string SolverResult::print(utils::PRINT_FORMAT format) const {
    switch(format) {
        case utils::PRINT_FORMAT::CSV:
            return printCSV();
        case utils::PRINT_FORMAT::TXT:
        default:
            return printTxt();
    }
};