#include "solver.h"

SolverConfig SolverConfig::fromYaml(const std::string& file_path) {
    SolverConfig cfg; // defaults already set

    YAML::Node root = YAML::LoadFile(file_path);

    // --- Simulated Annealing ---
    if (auto sa = root["simulated_annealing"]) {
        if (sa["max_init_tries"])        cfg.sa_maxInitTries = sa["max_init_tries"].as<int>();
        if (sa["max_iterations"])        cfg.sa_maxIterations = sa["max_iterations"].as<int>();
        if (sa["timeout"])               cfg.sa_timeout = sa["timeout"].as<int>();
        if (sa["stagnation_limit"])      cfg.sa_stagnationLimit = sa["stagnation_limit"].as<int>();
        if (sa["max_neighbor_tries"])    cfg.sa_maxNeighborTries = sa["max_neighbor_tries"].as<int>();
        if (sa["initial_temperature"])   cfg.sa_initialTemperature = sa["initial_temperature"].as<double>();
        if (sa["cooling_rate"])          cfg.sa_coolingRate = sa["cooling_rate"].as<double>();
        if (sa["min_temperature"])       cfg.sa_minTemperature = sa["min_temperature"].as<double>();
        if (sa["sigma_max"])             cfg.sa_sigmaMax = sa["sigma_max"].as<double>();
        if (sa["refinement_iterations"]) cfg.sa_refinementIterations = sa["refinement_iterations"].as<int>();
        if (sa["pso_swarm_size"])        cfg.sa_pso_swarmSize = sa["pso_swarm_size"].as<int>();
        if (sa["pso_velocity_clamp"])    cfg.sa_pso_velocityClamp = sa["pso_velocity_clamp"].as<int>();
        if (sa["pso_inertia_weight"])    cfg.sa_pso_inertiaWeight = sa["pso_inertia_weight"].as<double>();
        if (sa["pso_cognitive_coef"]) cfg.sa_pso_cognitiveCoefficient = sa["pso_cognitive_coef"].as<double>();
        if (sa["pso_social_coef"])    cfg.sa_pso_socialCoefficient = sa["pso_social_coef"].as<double>();
    }

    // --- Random Search ---
    if (auto rs = root["random_search"]) {
        if (rs["max_iterations"])            cfg.rs_maxIterations = rs["max_iterations"].as<int>();
        if (rs["timeout"])                   cfg.rs_timeout = rs["timeout"].as<int>();
        if (rs["stagnation_limit"])          cfg.rs_stagnationLimit = rs["stagnation_limit"].as<int>();
        if (rs["break_on_first_feasible"])   cfg.rs_breakOnFirstFeasible = rs["break_on_first_feasible"].as<bool>();
    }

    // --- Genetic Algorithm ---
    if (auto ga = root["genetic_algorithm"]) {
        if (ga["population_size"])   cfg.ga_populationSize = ga["population_size"].as<int>();
        if (ga["max_generations"])    cfg.ga_maxGenerations = ga["max_generations"].as<int>();
        if (ga["timeout"])            cfg.ga_timeout = ga["timeout"].as<int>();
        if (ga["elite_count"])        cfg.ga_eliteCount = ga["elite_count"].as<int>();
        if (ga["stagnation_limit"])   cfg.ga_stagnationLimit = ga["stagnation_limit"].as<int>();
        if (ga["mutation_rate"])      cfg.ga_mutationRate = ga["mutation_rate"].as<double>();
        if (ga["crossover_rate"])     cfg.ga_crossoverRate = ga["crossover_rate"].as<double>();
    }

    return cfg;
}   

void SolverConfig::print() const {
    utils::dbg << "Solver Configuration:\n";
    utils::dbg << "  Solver Method: ";
    switch (solverMethod) {
        case SolverMethod::RANDOM_SEARCH:
            utils::dbg << "RANDOM_SEARCH\n";
            break;
        case SolverMethod::SIMULATED_ANNEALING:
            utils::dbg << "SIMULATED_ANNEALING\n";
            break;
        case SolverMethod::GENETIC_ALGORITHM:
            utils::dbg << "GENETIC_ALGORITHM\n";
            break;
    }

    utils::dbg << "  Priority Refinement Method: ";
    switch (priorityRefinementMethod) {
        case PriorityRefinementMethod::NORMAL_PERTURBATION:
            utils::dbg << "NORMAL_PERTURBATION\n";
            break;
        case PriorityRefinementMethod::PARTICLE_SWARM_OPTIMIZATION:
            utils::dbg << "PARTICLE_SWARM_OPTIMIZATION\n";
            break;
    }

    utils::dbg << "  Simulated Annealing Parameters:\n";
    utils::dbg << "    maxInitTries: " << sa_maxInitTries << "\n";
    utils::dbg << "    maxIterations: " << sa_maxIterations << "\n";
    utils::dbg << "    maxNeighborTries: " << sa_maxNeighborTries << "\n";
    utils::dbg << "    initialTemperature: " << sa_initialTemperature << "\n";
    utils::dbg << "    coolingRate: " << sa_coolingRate << "\n";
    utils::dbg << "    minTemperature: " << sa_minTemperature << "\n";

    utils::dbg << "  Random Search Parameters:\n";
    utils::dbg << "    maxIterations: " << rs_maxIterations << "\n";
    utils::dbg << "    breakOnFirstFeasible: " << (rs_breakOnFirstFeasible ? "true" : "false") << "\n";

    utils::dbg << "  Genetic Algorithm Parameters:\n";
    utils::dbg << "    populationSize: " << ga_populationSize << "\n";
    utils::dbg << "    maxGenerations: " << ga_maxGenerations << "\n";
    utils::dbg << "    mutationRate: " << ga_mutationRate << "\n";
    utils::dbg << "    crossoverRate: " << ga_crossoverRate << "\n";
}   