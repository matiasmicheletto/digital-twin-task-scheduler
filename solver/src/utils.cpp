#include "../include/utils.h"

namespace utils {

std::filesystem::path getBinaryDir(){
#if defined(_WIN32)

    wchar_t buffer[MAX_PATH];
    DWORD len = GetModuleFileNameW(nullptr, buffer, MAX_PATH);
    if (len == 0 || len == MAX_PATH)
        throw_runtime_error("GetModuleFileNameW failed");

    return std::filesystem::path(buffer).parent_path();

#elif defined(__APPLE__)

    uint32_t size = 0;
    _NSGetExecutablePath(nullptr, &size); // get required size

    std::string buffer(size, '\0');
    if (_NSGetExecutablePath(buffer.data(), &size) != 0)
        throw_runtime_error("_NSGetExecutablePath failed");

    return std::filesystem::canonical(buffer).parent_path();

#elif defined(__linux__)

    char buffer[PATH_MAX];
    ssize_t len = ::readlink("/proc/self/exe", buffer, sizeof(buffer) - 1);
    if (len == -1)
        throw_runtime_error("Cannot resolve /proc/self/exe");

    buffer[len] = '\0';
    return std::filesystem::path(buffer).parent_path();

#else
    #error "Unsupported platform"
#endif
}

std::string getBinaryDirStr() {
#ifdef _WIN32
    char result[MAX_PATH];
    GetModuleFileName(NULL, result, MAX_PATH);
    std::string path(result);
    return path.substr(0, path.find_last_of("\\/"));
#else
    char result[PATH_MAX];
    ssize_t count = readlink("/proc/self/exe", result, PATH_MAX);
    if (count == -1) throw_runtime_error("Cannot resolve /proc/self/exe");    
    std::string path(result, count);
    return path.substr(0, path.find_last_of('/'));
#endif
}

std::string generate_uuid() {
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
        std::string execDir = getBinaryDirStr();
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

    throw_runtime_error("Unable to open manual file: " + std::string(file));
    exit(1);
}

std::string currentDateTime() {
    std::time_t now = std::time(nullptr);
    char buf[100];
    std::strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", std::localtime(&now));
    return std::string(buf);
}

int getElapsedMs(const std::chrono::high_resolution_clock::time_point& start_time) {
    auto end_time = std::chrono::high_resolution_clock::now();
    return static_cast<int>(std::chrono::duration_cast<std::chrono::seconds>(end_time - start_time).count());
}

template<typename T>
T require_type(const nlohmann::json& obj, const std::string& key) {
    // Throws nlohmann::json::out_of_range if key is missing
    const auto& value = obj.at(key);

    if constexpr (std::is_same_v<T, bool>) {
        if (!value.is_boolean()) {
            throw_runtime_error("Invalid JSON: boolean field '" + key + "' expected");
        }
        return value.get<bool>();
    }
    else if constexpr (std::is_same_v<T, std::string>) {
        if (!value.is_string()) {
            throw_runtime_error("Invalid JSON: string field '" + key + "' expected");
        }
        return value.get<std::string>();
    }
    else if constexpr (std::is_floating_point_v<T>) {
        // Accept any numeric JSON (int, unsigned, or float); convert to T
        if (!value.is_number()) {
            throw_runtime_error("Invalid JSON: numeric (float) field '" + key + "' expected");
        }
        return value.get<T>();
    }
    else if constexpr (std::is_integral_v<T> && !std::is_same_v<T, bool>) {
        // Accept both signed and unsigned JSON numbers
        if (!(value.is_number_integer() || value.is_number_unsigned())) {
            throw_runtime_error("Invalid JSON: integer field '" + key + "' expected");
        }

        // Bounds-safe extraction to avoid UB/narrowing:
        if constexpr (std::is_signed_v<T>) {
            // Pull as int64, then check bounds for T
            long long v = value.is_number_unsigned()
                        ? static_cast<long long>(value.get<unsigned long long>()) // safe if within range
                        : value.get<long long>();

            if (v < static_cast<long long>(std::numeric_limits<T>::min()) ||
                v > static_cast<long long>(std::numeric_limits<T>::max())) {
                throw_runtime_error("Invalid JSON: integer field '" + key + "' out of range");
            }
            return static_cast<T>(v);
        } else {
            // Unsigned target
            unsigned long long v = value.is_number_unsigned()
                                 ? value.get<unsigned long long>()
                                 : static_cast<unsigned long long>(value.get<long long>());

            if (v > static_cast<unsigned long long>(std::numeric_limits<T>::max())) {
                throw_runtime_error("Invalid JSON: unsigned field '" + key + "' out of range");
            }
            return static_cast<T>(v);
        }
    }
    else {
        // Fallback: rely on nlohmann::json conversion (e.g., vectors, custom structs with adl_serializer)
        try {
            return value.get<T>();
        } catch (const std::exception& e) {
            throw_runtime_error("Invalid JSON: field '" + key + "' has wrong type: " + std::string(e.what()));
            return T(); // Unreachable
        }
    }
}

double randNormal(double mean, double stddev) {
    std::normal_distribution<double> distribution(mean, stddev);
    return distribution(gen);
}

double clamp(double value, double minVal, double maxVal) {
    if (value < minVal) return minVal;
    if (value > maxVal) return maxVal;
    return value;
}

template int require_type<int>(const nlohmann::json&, const std::string&);
template bool require_type<bool>(const nlohmann::json&, const std::string&);
template std::string require_type<std::string>(const nlohmann::json&, const std::string&);
template double require_type<double>(const nlohmann::json&, const std::string&);
template std::vector<std::string> require_type<std::vector<std::string>>(const nlohmann::json&, const std::string&);

} // namespace utils