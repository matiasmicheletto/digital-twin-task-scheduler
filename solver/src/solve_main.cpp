#define MANUAL "assets/solve_manual.txt"

#include <iostream>
#include <cstring>
#include <fstream>
#include <vector>

#include "../include/json.hpp"
#include "../include/utils.h"
#include "../include/scheduler.h"
#include "../include/solver.h"


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

    for(int i = 0; i < argc; i++) {  
        if(argc == 1) {
            utils::printHelp(MANUAL, "No arguments provided.");
        }
        
        if(strcmp(argv[i], "-v") == 0 || strcmp(argv[i], "--version") == 0) {
            std::cout << "Solver version 1.0.0" << std::endl;
            return 0;
        }
        
        if(strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0)
            utils::printHelp(MANUAL);

        if(strcmp(argv[i], "-s") == 0 || strcmp(argv[i], "--solver") == 0) {
            // Enable solving
            solve = true;
            // Check for method
            if(i+1 < argc) {
                const char* mth = argv[i+1];
                if(strcmp(mth, "random") == 0) {
                    method = SolverMethod::RANDOM_SEARCH;
                } else if (strcmp(mth, "genetic") == 0) {
                    method = SolverMethod::GENETIC_ALGORITHM;
                } else if (strcmp(mth, "annealing") == 0) {
                    method = SolverMethod::SIMULATED_ANNEALING;
                } else {
                    utils::printHelp(MANUAL, "Error in argument -s (--solve). Supported methods are: random, genetic, annealing");
                }
            }else{
                utils::printHelp(MANUAL, "Error in argument -s (--solve). A method must be provided");
            }
        }   

        if(strcmp(argv[i], "-t") == 0 || strcmp(argv[i], "--tasks") == 0) {
            if(i+1 < argc) {
                const char* file = argv[i+1];
                tsk_filename = std::string(file);
            }else{
                utils::printHelp(MANUAL, "Error in argument -t (--tasks). A filename must be provided");
            }
        }

        if(strcmp(argv[i], "-n") == 0 || strcmp(argv[i], "--network") == 0) {
            if(i+1 < argc) {
                const char* file = argv[i+1];
                nw_filename = std::string(file);
            }else{
                utils::printHelp(MANUAL, "Error in argument -n (--network). A filename must be provided");
            }
        }

        if(strcmp(argv[i], "-d") == 0 || strcmp(argv[i], "--dat") == 0) {
            if(i+1 < argc) {
                const char* file = argv[i+1];
                dat_filename = std::string(file);
            }else{
                utils::printHelp(MANUAL, "Error in argument -d (--dat). A filename must be provided");
            }
        }

        if(strcmp(argv[i], "-i") == 0 || strcmp(argv[i], "--initial") == 0) {
            use_initial_solution = true;
        }

        if(strcmp(argv[i], "-c") == 0 || strcmp(argv[i], "--config") == 0) {
            if(i+1 < argc) {
                const char* file = argv[i+1];
                cfg_filename = std::string(file);
            }
        }

        if(strcmp(argv[i], "-o") == 0 || strcmp(argv[i], "--output") == 0) {
            if(i+1 < argc) {
                const char* format = argv[i+1];
                if(strcmp(format, "text") == 0) {
                    output_format = utils::PRINT_FORMAT::TXT;
                } else if (strcmp(format, "json") == 0) {
                    output_format = utils::PRINT_FORMAT::JSON;
                } else if (strcmp(format, "csv") == 0) {
                    output_format = utils::PRINT_FORMAT::CSV;
                } else if (strcmp(format, "tab") == 0) {
                    output_format = utils::PRINT_FORMAT::TAB;
                } else {
                    utils::printHelp(MANUAL, "Error in argument -o (--output). Supported formats are: text, json");
                }
            }else{
                utils::printHelp(MANUAL, "Error in argument -o (--output). An output format must be provided");
            }   
        }

        if(strcmp(argv[i], "--set") == 0) {
            if(i + 1 < argc) {
                cfg_overrides.emplace_back(argv[i+1]);
            } else {
                utils::printHelp(MANUAL, "Error in --set. Use --set key=value");
            }
        }

        if(strcmp(argv[i], "--dbg") == 0) {
            utils::dbg.rdbuf(std::cout.rdbuf()); // Enable debug output to std::cout
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

