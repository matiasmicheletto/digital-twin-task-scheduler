#include "../include/global.hpp"

namespace global {

std::string getExecutableDir() {
#ifdef _WIN32
    char result[MAX_PATH];
    GetModuleFileName(NULL, result, MAX_PATH);
    std::string path(result);
    return path.substr(0, path.find_last_of("\\/"));
#else
    char result[PATH_MAX];
    ssize_t count = readlink("/proc/self/exe", result, PATH_MAX);
    if (count == -1) throw std::runtime_error("Cannot resolve /proc/self/exe");
    std::string path(result, count);
    return path.substr(0, path.find_last_of('/'));
#endif
}

std::string generate_uuid() {
    static std::random_device              rd;
    static std::mt19937                    gen(rd());
    static std::uniform_int_distribution<> dis(0, 15);
    static std::uniform_int_distribution<> dis2(8, 11);

    std::stringstream ss;
    int i;
    ss << std::hex;
    for (i = 0; i < 8; i++) {
        ss << dis(gen);
    }
    ss << "-";
    for (i = 0; i < 4; i++) {
        ss << dis(gen);
    }
    ss << "-4";
    for (i = 0; i < 3; i++) {
        ss << dis(gen);
    }
    ss << "-";
    ss << dis2(gen);
    for (i = 0; i < 3; i++) {
        ss << dis(gen);
    }
    ss << "-";
    for (i = 0; i < 12; i++) {
        ss << dis(gen);
    }
    return ss.str();
}


void printHelp(const char* file, const char* message) { // Open readme file with manual and print on terminal   
    std::cerr << std::endl << message << std::endl << std::endl;
    std::ifstream manualFile(file);
    if (manualFile.is_open()) {
        std::string line;
        while (getline(manualFile, line)) {
            std::cout << line << std::endl;
        }
        manualFile.close();
        exit(1);
    } else { // try to load from executable dir
        std::string execDir = getExecutableDir();
        std::string fullPath = execDir + "/" + file;
        std::ifstream defaultManualFile(fullPath);
        if (defaultManualFile.is_open()) {
            std::string line;
            while (getline(defaultManualFile, line)) {
                std::cout << line << std::endl;
            }
            defaultManualFile.close();
            exit(1);
        }
    }

    std::cerr << "Error: Unable to open manual file." << std::endl;
}

} // namespace utils