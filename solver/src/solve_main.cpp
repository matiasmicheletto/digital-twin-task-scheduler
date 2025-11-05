#define MANUAL "assets/solve_manual.txt"

#include <iostream>
#include <cstring>

#include "../include/json.hpp"
#include "../include/global.hpp"


int main(int argc, char **argv) {

    std::string tsk_filename; // Tasks file (json)
    std::string nw_filename; // Network file (json)

    for(int i = 0; i < argc; i++) {    
        if(strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0 || argc == 1)
            global::printHelp(MANUAL);

        if(strcmp(argv[i], "-t") == 0 || strcmp(argv[i], "--tasks") == 0) {
            if(i+1 < argc) {
                const char* file = argv[i+1];
                tsk_filename = std::string(file);
            }else{
                global::printHelp(MANUAL, "Error in argument -t (--tasks). A filename must be provided");
            }
        }

        if(strcmp(argv[i], "-n") == 0 || strcmp(argv[i], "--network") == 0) {
            if(i+1 < argc) {
                const char* file = argv[i+1];
                nw_filename = std::string(file);
            }else{
                global::printHelp(MANUAL, "Error in argument -n (--network). A filename must be provided");
            }
        }

        if(strcmp(argv[i], "--dbg") == 0) {
            global::dbg.rdbuf(std::cout.rdbuf()); // Enable debug output to std::cout
        }
    }

    return 0;
}

