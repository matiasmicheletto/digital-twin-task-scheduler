#define MANUAL "assets/solve_manual.txt"

#include <iostream>
#include <cstring>

#include "../include/json.hpp"
#include "../include/utils.h"
#include "../include/digital_twin.h"


int main(int argc, char **argv) {

    std::string tsk_filename; // Tasks file (json)
    std::string nw_filename; // Network file (json)
    utils::PRINT_TYPE output_format = utils::PRINT_TYPE::PLAIN_TEXT;

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

        if(strcmp(argv[i], "-o") == 0 || strcmp(argv[i], "--output") == 0) {
            if(i+1 < argc) {
                const char* format = argv[i+1];
                if(strcmp(format, "text") == 0) {
                    output_format = utils::PRINT_TYPE::PLAIN_TEXT;
                } else if (strcmp(format, "json") == 0) {
                    output_format = utils::PRINT_TYPE::JSON;
                } else {
                    utils::printHelp(MANUAL, "Error in argument -o (--output). Supported formats are: text, json");
                }
            }else{
                utils::printHelp(MANUAL, "Error in argument -o (--output). An output format must be provided");
            }   
        }

        if(strcmp(argv[i], "--dbg") == 0) {
            utils::dbg.rdbuf(std::cout.rdbuf()); // Enable debug output to std::cout
        }
    }    
    
    try {
        DigitalTwin dt(tsk_filename, nw_filename);
        const Candidate candidate{ // Example
            .server_indices = {0, 1, 2, 0, 1, 2, 3},
            .priorities = {1.0, 0.5, 0.8, 1.0, 0.2, 0.33, 1.4}
        };
        dt.schedule(candidate);
        dt.print(output_format);
    } catch (const std::exception& e) {
        utils::dbg << "Error: " << e.what() << "\n";
        utils::printHelp(MANUAL);
    }

    return 0;
}

