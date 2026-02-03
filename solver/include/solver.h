#ifndef SOLVER_H
#define SOLVER_H

#include <yaml-cpp/yaml.h>
#include <fstream>
#include "utils.h"
#include "scheduler.h"

enum PriorityRefinementMethod {
    NORMAL_PERTURBATION,
    PARTICLE_SWARM_OPTIMIZATION
};

enum SolverMethod {
    RANDOM_SEARCH,
    GENETIC_ALGORITHM,
    SIMULATED_ANNEALING
};

std::string solverMethodToString(SolverMethod method);
std::string priorityRefinementMethodToString(PriorityRefinementMethod method);

class SolverConfig { // Configuration parameters for the solver
public:
    SolverConfig() : log(&utils::dbg) {}

    // General solver parameters
    SolverMethod solverMethod = SolverMethod::RANDOM_SEARCH;

    double alpha = 1.0; // Weight for finish time sum in objective function
    double beta = 0.0;  // Weight for delay cost in objective function
    double gamma = 0.0; // Weight for processors cost in objective function

    // Parameters for Simulated Annealing
    int sa_maxInitTries = 3000;
    int sa_maxIterations = 3000;
    int sa_timeout_sec = 3600;
    double sa_stagnationThreshold = 1e-6;
    int sa_stagnationLimit = 200; // Number of iterations without improvement before stopping
    double sa_perturbationRate = 0.1; // Probability of perturbation for each task
    int sa_maxNeighborTries = 20; // Number of neighbor solutions to try at each temperature
    double sa_initialTemperature = 100.0;
    double sa_coolingRate = 0.995;
    double sa_minTemperature = 1e-3;
    // Refinement parameters
    PriorityRefinementMethod sa_priorityRefinementMethod = PriorityRefinementMethod::NORMAL_PERTURBATION;
    double sa_sigmaMax = 0.1; // Maximum standard deviation for priority refinement (use smaller values for finer adjustments)
    double sa_sigmaMin = 1e-3; // Minimum standard deviation for priority refinement
    int sa_refinementIterations = 50;
    int sa_pso_swarmSize = 30;
    int sa_pso_velocityClamp = 2;
    double sa_pso_inertiaWeight = 0.5;
    double sa_pso_cognitiveCoefficient = 1.5;
    double sa_pso_socialCoefficient = 1.5;

    // Parameters for Random Search
    int rs_maxIterations = 1000;
    int rs_timeout_sec = 3600;
    double rs_stagnationThreshold = 1e-6;
    int rs_stagnationLimit = 200;
    double rs_perturbationRate = 0.1;
    bool rs_breakOnFirstFeasible = false;

    // Parameters for Genetic Algorithm
    // Variables with type size_t are used for counts to avoid signed/unsigned comparison warnings
    int ga_maxInitTries = 3000;
    size_t ga_populationSize = 100;
    int ga_maxGenerations = 500;
    int ga_timeout_sec = 3600;
    size_t ga_eliteCount = 5;
    double ga_stagnationThreshold = 1e-6;
    int ga_stagnationLimit = 50;
    double ga_mutationRate = 0.15;
    double ga_crossoverRate = 0.75;

    // Randomization parameters
    int allocationNoiseLevel = 10; // Noise level for task allocation randomization (higher values increase randomness)
    int priorityNoiseLevel = 10;   // Noise level for priority randomization (higher values increase randomness)

    void fromYaml(const std::string& file_path);
    void applyOverride(const std::string& override_str); // Override parameter from "key=value" string
    
    void setLogFile(const std::string& file_path);
    std::ostream* log;

    std::string print() const;

private:
    std::ofstream log_file_stream;
};


class SolverResult {
public:
    enum class SolverStatus {
        NOT_STARTED,
        COMPLETED,
        TIMEOUT,
        STAGNATION,
        SOLUTION_NOT_FOUND,
        INITIALIZATION_ERROR,
        INITIALIZATION_NOT_FEASIBLE,
        ERROR
    } status;

    std::string instanceName;

    SolverMethod method;
    PriorityRefinementMethod refinement;
    ScheduleState scheduleState;
    Candidate bestCandidate;

    double alpha;
    double beta;
    double gamma;

    int runtime_ms;
    int iterations;
    int scheduleSpan;
    int finishTimeSum;
    int processorsCost;
    int delayCost;
    std::string observations;

    double getObjectiveValue() const;

    static std::string getHeaderCSV();
    std::string solverStatusToString() const;
    std::string print(utils::PRINT_FORMAT = utils::PRINT_FORMAT::TXT) const;

    SolverResult() : 
        status(SolverStatus::NOT_STARTED),
        instanceName(""),
        method(SolverMethod::RANDOM_SEARCH),
        refinement(PriorityRefinementMethod::NORMAL_PERTURBATION),
        scheduleState(ScheduleState::NOT_SCHEDULED),
        bestCandidate(Candidate(0)),
        alpha(0.0),
        beta(0.0),
        gamma(0.0),
        runtime_ms(0), 
        iterations(0), 
        scheduleSpan(0), 
        finishTimeSum(0), 
        processorsCost(0), 
        delayCost(0),
        observations("")
    {}

    SolverResult(
        SolverStatus status,
        std::string instanceName,
        SolverMethod method,
        PriorityRefinementMethod refinement,
        ScheduleState scheduleState,
        const Candidate& bestCandidate,
        double alpha,
        double beta,
        double gamma,
        int runtime_ms,
        int iterations,
        int scheduleSpan,
        int finishTimeSum,
        int processorsCost,
        int delayCost,
        std::string observations
    ) : 
        status(status), 
        instanceName(instanceName),
        method(method),
        refinement(refinement),
        scheduleState(scheduleState),
        bestCandidate(bestCandidate),
        alpha(alpha),
        beta(beta),
        gamma(gamma),
        runtime_ms(runtime_ms), 
        iterations(iterations), 
        scheduleSpan(scheduleSpan), 
        finishTimeSum(finishTimeSum), 
        processorsCost(processorsCost), 
        delayCost(delayCost),
        observations(observations)
    {}
private: 
    std::string printTable(char separator = ',') const;
    std::string printTxt() const;
};

class Solver {
public:
    Solver(Scheduler& sch, SolverConfig& config) : 
        scheduler(sch), 
        config(config)
    {}

    SolverResult solve();

    SolverConfig& getConfig() { return config; }

    inline std::string getSolverMethodName() const { return solverMethodToString(config.solverMethod); }

private: 
    Scheduler& scheduler;    
    SolverConfig& config;

    double computeObjective() const;

    SolverResult randomSearchSolve();
    SolverResult geneticAlgorithmSolve();
    SolverResult simulatedAnnealingSolve();

    void refinePrioritiesNormal(Candidate& curr, int currFitness, double T);
    void refinePrioritiesPSO(Candidate& curr, int currFitness, double T);
    void refinePriorities(PriorityRefinementMethod refinementMethod, Candidate& curr, int currFitness, double T);

    void randomizeCandidate(Candidate& candidate, double perturbationRate);
};


#endif // SOLVER_H