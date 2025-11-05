#pragma once
#ifndef GLOBAL_HPP
#define GLOBAL_HPP

#include <iostream>
#include <fstream>
#include <cmath>
#include <unistd.h>
#include <limits.h>
#include <sstream>
#include <iomanip>
#include <string>
#include <random>

// Same as __DBL_MAX__ from <cfloat> but compatible with C++17
#define DBL_MAX std::numeric_limits<double>::max()

/**
 * 
 * @brief Utility functions and specification constants
 * 
 */



namespace global { // Utility functions

enum PRINT_TYPE { PLAIN_TEXT, JSON };

// Get directory of the executable (to load the manual file if not specified)
std::string getExecutableDir();

// Generate a simple UUID (not RFC4122 compliant, just for unique IDs)
std::string generate_uuid();

// Print help message from file
inline constexpr const char defaultMessage[] = "Error in command line arguments. See manual or documentation.";
void printHelp(const char* file, const char* message = defaultMessage); 

// Random number generator
static std::random_device rd;
static std::mt19937 gen(rd());

struct NullBuffer : std::streambuf {
    int overflow(int c) override { return c; }
};

// Debug output stream (disabled by default)
// Usage: dbg << "Debug info: " << value << std::endl;
inline NullBuffer null_buffer;
inline std::ostream null_stream(&null_buffer);
inline std::ostream& dbg = null_stream;

} // namespace global

#endif // GLOBAL_HPP