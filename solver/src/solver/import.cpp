#include "solver.h"
#include <filesystem>
#include <fstream>

void SolverConfig::fromYaml(const std::string& file_path) {

    YAML::Node root = YAML::LoadFile(file_path);

    // --- Check if file loaded correctly ---
    if (!root) {
        utils::dbg << "Failed to load YAML config file: " << file_path << "\n";
        utils::dbg << "Using default solver configuration parameters.\n";
    }

    // --- Tuning Parameters --- 
    if( auto tuning = root["tuning"] ) {
        if (tuning["alpha"])  alpha = tuning["alpha"].as<double>();
        if (tuning["beta"])   beta = tuning["beta"].as<double>();
        if (tuning["gamma"])  gamma = tuning["gamma"].as<double>();
    }

    // --- Simulated Annealing ---
    if (auto sa = root["simulated_annealing"]) {
        if (sa["refinement_priority_method"]) {
            std::string method = sa["refinement_priority_method"].as<std::string>();
            if (method == "NORMAL")
                sa_priorityRefinementMethod = PriorityRefinementMethod::NORMAL_PERTURBATION;
            else if (method == "PSO")
                sa_priorityRefinementMethod = PriorityRefinementMethod::PARTICLE_SWARM_OPTIMIZATION;
            else
                utils::throw_runtime_error("Invalid refinement_priority_method in YAML config");
        }
        if (sa["max_init_tries"])                   sa_maxInitTries = sa["max_init_tries"].as<int>();
        if (sa["max_iterations"])                   sa_maxIterations = sa["max_iterations"].as<int>();
        if (sa["timeout"])                          sa_timeout_sec = sa["timeout"].as<int>();
        if (sa["stagnation_threshold"])             sa_stagnationThreshold = sa["stagnation_threshold"].as<double>();
        if (sa["stagnation_limit"])                 sa_stagnationLimit = sa["stagnation_limit"].as<int>();
        if (sa["perturbation_rate"])               sa_perturbationRate = sa["perturbation_rate"].as<double>();
        if (sa["max_neighbor_tries"])               sa_maxNeighborTries = sa["max_neighbor_tries"].as<int>();
        if (sa["initial_temperature"])              sa_initialTemperature = sa["initial_temperature"].as<double>();
        if (sa["cooling_rate"])                     sa_coolingRate = sa["cooling_rate"].as<double>();
        if (sa["min_temperature"])                  sa_minTemperature = sa["min_temperature"].as<double>();
        if (sa["refinement_sigma_max"])             sa_sigmaMax = sa["refinement_sigma_max"].as<double>();
        if (sa["refinement_sigma_min"])             sa_sigmaMin = sa["refinement_sigma_min"].as<double>();
        if (sa["refinement_iterations"])            sa_refinementIterations = sa["refinement_iterations"].as<int>();
        if (sa["pso_swarm_size"])                   sa_pso_swarmSize = sa["pso_swarm_size"].as<int>();
        if (sa["refinement_pso_velocity_clamp"])    sa_pso_velocityClamp = sa["refinement_pso_velocity_clamp"].as<int>();
        if (sa["refinement_pso_inertia_weight"])    sa_pso_inertiaWeight = sa["refinement_pso_inertia_weight"].as<double>();
        if (sa["refinement_pso_cognitive_coef"])    sa_pso_cognitiveCoefficient = sa["refinement_pso_cognitive_coef"].as<double>();
        if (sa["refinement_pso_social_coef"])       sa_pso_socialCoefficient = sa["refinement_pso_social_coef"].as<double>();
    }

    // --- Random Search ---
    if (auto rs = root["random_search"]) {
        if (rs["max_iterations"])            rs_maxIterations = rs["max_iterations"].as<int>();
        if (rs["timeout"])                   rs_timeout_sec = rs["timeout"].as<int>();
        if (rs["stagnation_threshold"])      rs_stagnationThreshold = rs["stagnation_threshold"].as<double>();
        if (rs["stagnation_limit"])          rs_stagnationLimit = rs["stagnation_limit"].as<int>();
        if (rs["perturbation_rate"])         rs_perturbationRate = rs["perturbation_rate"].as<double>();
        if (rs["break_on_first_feasible"])   rs_breakOnFirstFeasible = rs["break_on_first_feasible"].as<bool>();
    }

    // --- Genetic Algorithm ---
    if (auto ga = root["genetic_algorithm"]) {
        if (ga["max_init_tries"])            ga_maxInitTries = ga["max_init_tries"].as<int>();
        if (ga["population_size"])          ga_populationSize = ga["population_size"].as<size_t>();
        if (ga["max_generations"])          ga_maxGenerations = ga["max_generations"].as<int>();
        if (ga["timeout"])                  ga_timeout_sec = ga["timeout"].as<int>();
        if (ga["elite_count"])              ga_eliteCount = ga["elite_count"].as<size_t>();
        if (ga["stagnation_threshold"])  ga_stagnationThreshold = ga["stagnation_threshold"].as<double>();
        if (ga["stagnation_limit"])         ga_stagnationLimit = ga["stagnation_limit"].as<int>();
        if (ga["mutation_rate"])            ga_mutationRate = ga["mutation_rate"].as<double>();
        if (ga["crossover_rate"])           ga_crossoverRate = ga["crossover_rate"].as<double>();
    }

    // --- Misc ---
    if (auto misc = root["misc"]) {
        if (misc["log_file"]) {
            std::string log_file = misc["log_file"].as<std::string>();
            setLogFile(log_file);
        }else{
            log = &utils::dbg;
        }
    }
};

void SolverConfig::applyOverride(const std::string& override_str) {
    // Parse key=value
    // Overrides are applied after loading from YAML

    auto pos = override_str.find('=');
    if (pos == std::string::npos)
        utils::throw_runtime_error("Invalid override (expected key=value): " + override_str);

    std::string key = override_str.substr(0, pos);
    std::string val = override_str.substr(pos + 1);

    auto asBool = [&](const std::string& v) {
        if (v == "true" || v == "1") return true;
        if (v == "false" || v == "0") return false;
        utils::throw_runtime_error("Invalid bool: " + v);
        return false;
    };

    // ---- Tuning ----
    if (key == "tuning.alpha") alpha = std::stod(val);
    else if (key == "tuning.beta") beta = std::stod(val);
    else if (key == "tuning.gamma") gamma = std::stod(val);

    // ---- SIMULATED ANNEALING ----
    else if (key == "simulated_annealing.max_init_tries") sa_maxInitTries = std::stoi(val);
    else if (key == "simulated_annealing.max_iterations") sa_maxIterations = std::stoi(val);
    else if (key == "simulated_annealing.timeout") sa_timeout_sec = std::stoi(val);
    else if (key == "simulated_annealing.stagnation_threshold") sa_stagnationThreshold = std::stod(val);
    else if (key == "simulated_annealing.stagnation_limit") sa_stagnationLimit = std::stoi(val);
    else if (key == "simulated_annealing.perturbation_rate") sa_perturbationRate = std::stod(val);
    else if (key == "simulated_annealing.max_neighbor_tries") sa_maxNeighborTries = std::stoi(val);
    else if (key == "simulated_annealing.initial_temperature") sa_initialTemperature = std::stod(val);
    else if (key == "simulated_annealing.cooling_rate") sa_coolingRate = std::stod(val);
    else if (key == "simulated_annealing.min_temperature") sa_minTemperature = std::stod(val);

    else if (key == "simulated_annealing.refinement_priority_method") {
        if (val == "NORMAL")
            sa_priorityRefinementMethod = PriorityRefinementMethod::NORMAL_PERTURBATION;
        else if (val == "PSO")
            sa_priorityRefinementMethod = PriorityRefinementMethod::PARTICLE_SWARM_OPTIMIZATION;
        else
            utils::throw_runtime_error("Invalid refinement_priority_method: " + val);
    }

    else if (key == "simulated_annealing.refinement_sigma_max") sa_sigmaMax = std::stod(val);
    else if (key == "simulated_annealing.refinement_sigma_min") sa_sigmaMin = std::stod(val);
    else if (key == "simulated_annealing.refinement_iterations") sa_refinementIterations = std::stoi(val);
    else if (key == "simulated_annealing.pso_swarm_size") sa_pso_swarmSize = std::stoi(val);
    else if (key == "simulated_annealing.refinement_pso_velocity_clamp") sa_pso_velocityClamp = std::stoi(val);
    else if (key == "simulated_annealing.refinement_pso_inertia_weight") sa_pso_inertiaWeight = std::stod(val);
    else if (key == "simulated_annealing.refinement_pso_cognitive_coef") sa_pso_cognitiveCoefficient = std::stod(val);
    else if (key == "simulated_annealing.refinement_pso_social_coef") sa_pso_socialCoefficient = std::stod(val);

    // ---- RANDOM SEARCH ----
    else if (key == "random_search.max_iterations") rs_maxIterations = std::stoi(val);
    else if (key == "random_search.timeout") rs_timeout_sec = std::stoi(val);
    else if (key == "random_search.stagnation_threshold") rs_stagnationThreshold = std::stod(val);
    else if (key == "random_search.stagnation_limit") rs_stagnationLimit = std::stoi(val);
    else if (key == "random_search.perturbation_rate") rs_perturbationRate = std::stod(val);
    else if (key == "random_search.break_on_first_feasible") rs_breakOnFirstFeasible = asBool(val);

    // ---- GENETIC ALGORITHM ----
    else if (key == "genetic_algorithm.max_init_tries") ga_maxInitTries = std::stoi(val);
    else if (key == "genetic_algorithm.population_size") ga_populationSize = std::stoul(val);
    else if (key == "genetic_algorithm.max_generations") ga_maxGenerations = std::stoi(val);
    else if (key == "genetic_algorithm.timeout") ga_timeout_sec = std::stoi(val);
    else if (key == "genetic_algorithm.elite_count") ga_eliteCount = std::stoul(val);
    else if (key == "genetic_algorithm.stagnation_threshold") ga_stagnationThreshold = std::stod(val);
    else if (key == "genetic_algorithm.stagnation_limit") ga_stagnationLimit = std::stoi(val);
    else if (key == "genetic_algorithm.mutation_rate") ga_mutationRate = std::stod(val);
    else if (key == "genetic_algorithm.crossover_rate") ga_crossoverRate = std::stod(val);

    // ---- MISC ----
    else if (key == "misc.log_file") setLogFile(val);

    else {
        utils::throw_runtime_error("Unknown config key: " + key);
    }

    utils::dbg << "Override applied: " << key << "=" << val << "\n";
};


void SolverConfig::setLogFile(const std::string& file_path) {
    // Log file is used to append solver results in CSV format

    if (file_path.empty())
        return;

    // Use path relative to binary directory
    auto relative_path = utils::getBinaryDir() / file_path;
    std::string file_path_str = relative_path.string();

    // Check if file exists
    const bool file_exists = std::filesystem::exists(file_path_str);

    // Open file in append mode
    log_file_stream.open(file_path_str, std::ios::app);
    if (!log_file_stream.is_open())
        return;

    if (!file_exists) { // New file, write header
        if (log_file_stream.tellp() == 0) { // File is empty, write header
            log_file_stream << SolverResult::getHeaderCSV();
        }
    }

    log = &log_file_stream;

    utils::dbg << "Logging solver output to file: " << file_path_str << "\n";
} 