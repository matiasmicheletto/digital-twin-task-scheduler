#define MANUAL "assets/solve_manual.txt"

#include <iostream>
#include <cstring>

#include "../include/json.hpp"
#include "../include/utils.h"
#include "../include/task.h"


int main(int argc, char **argv) {

    std::string tsk_filename; // Tasks file (json)
    std::string nw_filename; // Network file (json)

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

        if(strcmp(argv[i], "--dbg") == 0) {
            utils::dbg.rdbuf(std::cout.rdbuf()); // Enable debug output to std::cout
        }

        
    }    
    
    utils::dbg << "Task file: " << tsk_filename << "\n";
    utils::dbg << "Network file: " << nw_filename << "\n";

    // Load tasks
    std::vector<Task> tasks;
    try {
        tasks = Task::loadTasksFromJSONFile(tsk_filename);
    } catch (const std::exception& e) {
        utils::printHelp(MANUAL, "Error loading tasks");
        utils::dbg << "Exception: " << e.what() << "\n";
    }

    utils::dbg << "Loaded " << tasks.size() << " tasks.\n";
    for (const auto& task : tasks) {
        task.print();
        std::cout << "---------------------\n";
    }

    return 0;
}

