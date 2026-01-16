#define MANUAL "assets/solve_manual.txt"

#include <iostream>
#include <cstring>
#include <fstream>

#include "../include/json.hpp"
#include "../include/utils.h"
#include "../include/scheduler.h"
#include "../include/solver.h"


int main(int argc, char **argv) {

    std::string tsk_filename; // Tasks file (json)
    std::string nw_filename; // Network file (json)
    std::string cfg_filename; // Solver config file (yaml)
    utils::PRINT_TYPE output_format = utils::PRINT_TYPE::PLAIN_TEXT;
    SolverMethod method = SolverMethod::RANDOM_SEARCH;
    bool solve = false;
    std::string log_file_name = "solver_log.csv";

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
                    output_format = utils::PRINT_TYPE::PLAIN_TEXT;
                } else if (strcmp(format, "json") == 0) {
                    output_format = utils::PRINT_TYPE::JSON;
                } else if (strcmp(format, "csv") == 0) {
                    output_format = utils::PRINT_TYPE::SCHEDULE_CSV;
                } else {
                    utils::printHelp(MANUAL, "Error in argument -o (--output). Supported formats are: text, json");
                }
            }else{
                utils::printHelp(MANUAL, "Error in argument -o (--output). An output format must be provided");
            }   
        }

        if(strcmp(argv[i], "--log") == 0) {
            if(i+1 < argc) {
                const char* file = argv[i+1];
                log_file_name = std::string(file);
            }
        }

        if(strcmp(argv[i], "--dbg") == 0) {
            utils::dbg.rdbuf(std::cout.rdbuf()); // Enable debug output to std::cout
        }
    }

    utils::dbg << "Initializing Scheduler with tasks file: " << tsk_filename << " and network file: " << nw_filename << "\n";
    
    try {
        Scheduler sch(tsk_filename, nw_filename);
        
        if(solve){
            SolverConfig config;
            if(!cfg_filename.empty()) {
                utils::dbg << "Loading solver configuration from file: " << cfg_filename << "\n";
                config.fromYaml(cfg_filename);
            }else{
                utils::dbg << "Using default solver configuration.\n";
            }
            config.solverMethod = method;
            config.setLogFile(log_file_name);
            config.print(); // Works if --dbg is enabled
            Solver solver(sch, config);
            Candidate c = solver.solve();
            
            // Print if text mode and feasible
            if(sch.getScheduleState() == SCHEDULED && output_format == utils::PRINT_TYPE::PLAIN_TEXT) {
                sch.print(output_format);
                std::cout << std::endl << "####################" << std::endl;
                std::cout << "Best candidate:" << std::endl;
                c.print();
                return 0;
            } else {
                utils::dbg << "No feasible solution could be scheduled.\n";
            }
        }else{
            std::cout << utils::red << "Solve flag not set. Skipping solving step." << utils::reset << "\n";
        }
        
        sch.print(output_format);
        
    } catch (const std::exception& e) {
        utils::dbg << "Error: " << e.what() << "\n";
    }

    return 0;
}

