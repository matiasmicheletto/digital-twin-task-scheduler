#define MANUAL "assets/solve_manual.txt"

#include <iostream>
#include <cstring>
#include <fstream>
#include <vector>
#include <filesystem>
#include <getopt.h>

#include "../include/json.hpp"
#include "../include/utils.h"
#include "../include/scheduler.h"
#include "../include/solver.h"


static struct option long_options[] = {
    {"help",        no_argument,        0,  'h' },
    {"version",     no_argument,        0,  'v' },
    {"solver",      required_argument,  0,  's' },
    {"tasks",       required_argument,  0,  't' },
    {"network",     required_argument,  0,  'n' },
    {"dat",         required_argument,  0,  'd' },
    {"init",        no_argument,        0,  'i' },
    {"config",      required_argument,  0,  'c' },
    {"output",      required_argument,  0,  'o' },
    {"set",         required_argument,  0,  'S' },
    {"dbg",         no_argument,        0,  'D' },
    {0,             0,                  0,  0   }
};

int main(int argc, char **argv) {

    // Parse command line arguments
    std::string tsk_filename; // Tasks file (json)
    std::string nw_filename; // Network file (json)
    std::string dat_filename; // Schedule file (dat)
    bool use_initial_solution = false; // Whether to use an initial solution from stdin
    std::string cfg_filename = "default_config.yaml"; // Solver config file (yaml)
    utils::PRINT_FORMAT output_format = utils::PRINT_FORMAT::TXT;
    SolverMethod method = SolverMethod::RANDOM_SEARCH;
    bool solve = false;
    std::vector<std::string> cfg_overrides; // Configuration overrides from command line

    int opt;
    int option_index = 0;

    while((opt = getopt_long(argc, argv, "vhs:t:n:d:ic:o:S:D", long_options, &option_index)) != -1) {
        switch(opt) {
            case 'v':
                std::cout << "Solver version 1.0.0" << std::endl;
                return 0;
            case 'h':
                utils::printHelp(MANUAL);
                return 0;
            case 's':
                solve = true;
                if(strcmp(optarg, "random") == 0) method = SolverMethod::RANDOM_SEARCH;
                else if(strcmp(optarg, "genetic") == 0) method = SolverMethod::GENETIC_ALGORITHM;
                else if(strcmp(optarg, "annealing") == 0) method = SolverMethod::SIMULATED_ANNEALING;
                else {
                    utils::printHelp(MANUAL, "Supported methods: random, genetic, annealing");
                    return 1;
                }
                break;
            case 't':
                tsk_filename = optarg;
                break;
            case 'n':
                nw_filename = optarg;
                break;
            case 'd':
                dat_filename = optarg;
                break;
            case 'i':
                use_initial_solution = true;
                break;
            case 'c':
                cfg_filename = optarg;
                break;
            case 'o':
                if(strcmp(optarg, "text") == 0) output_format = utils::PRINT_FORMAT::TXT;
                else if(strcmp(optarg, "json") == 0) output_format = utils::PRINT_FORMAT::JSON;
                else if(strcmp(optarg, "csv") == 0) output_format = utils::PRINT_FORMAT::CSV;
                else if(strcmp(optarg, "tab") == 0) output_format = utils::PRINT_FORMAT::TAB;
                else {
                    utils::printHelp(MANUAL, "Supported formats: text, json, csv, tab");
                    return 1;
                }
                break;
            case 'S':
                cfg_overrides.emplace_back(optarg);
                break;
            case 'D':
                utils::dbg.rdbuf(std::cout.rdbuf());
                break;
            case '?':
                return 1;
        }
    }

    // Check that dat file is not provided with tasks/network files
    if(!dat_filename.empty() && (!tsk_filename.empty() || !nw_filename.empty())) {
        utils::printHelp(MANUAL, "Error: Cannot provide both DAT file and tasks/network files.");
    }

    if(dat_filename.empty() && (tsk_filename.empty() || nw_filename.empty())) {
        utils::printHelp(MANUAL, "Error: Must provide either DAT file or both tasks and network files.");
    }

    try {
        
        // Initialize Scheduler
        Scheduler sch;

        if(!dat_filename.empty()) {
            utils::dbg << "Loading schedule from DAT file: " << dat_filename << "\n";
            sch = Scheduler(dat_filename);
        }

        if(!tsk_filename.empty() && !nw_filename.empty()) {
            utils::dbg << "Loading tasks from JSON file: " << tsk_filename << "\n";
            utils::dbg << "Loading network from JSON file: " << nw_filename << "\n";
            sch = Scheduler(tsk_filename, nw_filename);
        }

        if(use_initial_solution) {
            utils::dbg << "Reading initial solution from stdin...\n";
            std::string initial_solution_csv(
                (std::istreambuf_iterator<char>(std::cin)),std::istreambuf_iterator<char>()
            );
            sch.importScheduleFromCSV(initial_solution_csv);
            utils::dbg << "Initial solution set.\n";
            utils::dbg << "\nCandidate from current schedule:\n";
            utils::dbg << sch.getCandidateFromCurrentSchedule().print() << "\n";
        }
        
        if(solve){
            SolverConfig config;
            if(!cfg_filename.empty()) {
                // Resolve relative config path against the binary directory (and its parent)
                if (!std::filesystem::path(cfg_filename).is_absolute()) {
                    auto bin_dir = utils::getBinaryDir();
                    std::filesystem::path candidate = bin_dir / cfg_filename;
                    if (!std::filesystem::exists(candidate)) {
                        candidate = bin_dir.parent_path() / cfg_filename;
                    }
                    cfg_filename = candidate.string();
                }
                utils::dbg << "Loading solver configuration from file: " << cfg_filename << "\n";
                config.fromYaml(cfg_filename);
                for(const auto& ov : cfg_overrides) {
                    config.applyOverride(ov);
                }
            }else{
                utils::dbg << "Using default solver configuration.\n";
            }
            config.solverMethod = method;
            utils::dbg << config.print();
            Solver solver(sch, config);
            SolverResult result = solver.solve();
            
            if(sch.getScheduleState() != ScheduleState::SCHEDULED){
                // Clear assigned tasks from servers to avoid accessing corrupted data when printing
                sch.clearAllServerTasks();
                std::cout << "No feasible schedule found. Schedule State: " << sch.getScheduleState().toString() << "\n";
                return 1;
            }else{
                if(output_format == utils::PRINT_FORMAT::TXT){
                    std::cout << "Feasible schedule found:\n";
                    std::cout << result.print(output_format);
                    std::cout << "Schedule details:\n";
                    std::cout << sch.print(output_format);
                    return 0;
                }else{
                    std::cout << sch.print(output_format);
                    return 0;
                }
            }
        }else{
            std::cout << sch.print(output_format);
            return 0;
        }
        
    } catch (const std::exception& e) {
        utils::dbg << "Error: " << e.what() << "\n";
    }

    return 0;
}

