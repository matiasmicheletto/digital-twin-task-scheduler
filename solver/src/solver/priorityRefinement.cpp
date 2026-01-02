#include "solver.h"

void Solver::refinePrioritiesNormal(Candidate& curr, int currFitness, double T) {
    /* Normal perturbation refinement of task priorities
     * Key aspects:
        * - Each task's priority is perturbed using a normal distribution
        * - Standard deviation decreases with temperature for finer adjustments
        * - Iterative updates to refine priorities over several iterations
    */

    double sigma = config.sa_sigmaMax * (T / config.sa_initialTemperature);
    sigma = std::max(sigma, config.sa_sigmaMin); // ensure sigma does not go below minimum

    // For each task, perturb its priority with a normal distribution
    int noImproveCount = 0;
    for(int iter = 0; iter < config.sa_refinementIterations; ++iter){
        Candidate trial = curr;

        for (size_t i = 0; i < scheduler.getTaskCount(); ++i) {
            trial.priorities[i] += utils::randNormal(0, sigma);
            trial.priorities[i] = utils::clamp(trial.priorities[i], 0.0, 1.0);
        }

        // If the new candidate is better, accept it
        if (scheduler.schedule(trial)) {
            int fitness = scheduler.getFinishTimeSum();
            if (fitness < currFitness) {
                curr = trial;
                currFitness = fitness;
            }else{
                noImproveCount++;
            }
        }else{
            noImproveCount++;
        }
        if(noImproveCount >= 10){ // early stop if no improvement in 10 iterations
            break;
        }
    }
}

void Solver::refinePrioritiesPSO(Candidate& curr, int currFitness, double T) {
    /* PSO refinement of task priorities
     * Key aspects:
        * - Each particle represents a candidate solution (task priorities)
        * - Velocity influences how priorities are updated
        * - Personal best and global best guide the search
        * - Velocity clamping to control exploration
        * - Temperature-dependent parameters to adapt search behavior
        * - Iterative updates to refine priorities over several iterations
        * - Final update of curr to the best found solution
    */

    // PSO parameters
    int swarmSize = config.sa_pso_swarmSize;
    double inertiaWeight = config.sa_pso_inertiaWeight;
    double cognitiveCoefficient = config.sa_pso_cognitiveCoefficient;
    double socialCoefficient = config.sa_pso_socialCoefficient;
    int maxIterations = config.sa_refinementIterations;

    // Velocity clamp decreases with temperature
    double velocityClamp = static_cast<double>(config.sa_pso_velocityClamp) * (T / config.sa_initialTemperature);
    velocityClamp = std::max(velocityClamp, 0.1); // ensure velocity

    size_t taskCount = scheduler.getTaskCount();

    // Initialize swarm
    struct Particle {
        Candidate position;
        std::vector<double> velocity;
        Candidate bestPosition;
        int bestFitness;

        Particle(size_t taskCount) : 
            position(taskCount), 
            velocity(taskCount, 0.0), 
            bestPosition(taskCount), 
            bestFitness(INT_MAX) {}
    };

    std::vector<Particle> swarm; // Start from scratch (no refinement from curr)
    for (int i = 0; i < swarmSize; ++i) { // Randomly initialize positions and velocities
        Particle particle(taskCount);
        for (size_t j = 0; j < taskCount; ++j) {
            particle.position.priorities[j] = static_cast<double>(rand()) / RAND_MAX;
            particle.velocity[j] = (static_cast<double>(rand()) / RAND_MAX - 0.5) * 2.0; // random velocity in [-1, 1]
        }
        if(scheduler.schedule(particle.position)) {
            int fitness = scheduler.getFinishTimeSum();
            particle.bestPosition = particle.position;
            particle.bestFitness = fitness;
        }
        swarm.push_back(particle);
    }

    Candidate globalBestPosition = curr;
    int globalBestFitness = currFitness;

    // PSO main loop
    for (int iter = 0; iter < maxIterations; ++iter) {
        for (auto& particle : swarm) {
            // Update velocity and position
            for (size_t j = 0; j < taskCount; ++j) {
                double r1 = static_cast<double>(rand()) / RAND_MAX;
                double r2 = static_cast<double>(rand()) / RAND_MAX;

                particle.velocity[j] = inertiaWeight * particle.velocity[j]
                    + cognitiveCoefficient * r1 * (particle.bestPosition.priorities[j] - particle.position.priorities[j])
                    + socialCoefficient * r2 * (globalBestPosition.priorities[j] - particle.position.priorities[j]);

                // Clamp velocity
                particle.velocity[j] = utils::clamp(particle.velocity[j], -velocityClamp, velocityClamp);

                // Update position
                particle.position.priorities[j] += particle.velocity[j];
                particle.position.priorities[j] = utils::clamp(particle.position.priorities[j], 0.0, 1.0);
            }

            // Evaluate fitness
            if (scheduler.schedule(particle.position)) {
                int fitness = scheduler.getFinishTimeSum();
                // Update personal best
                if (fitness < particle.bestFitness) {
                    particle.bestPosition = particle.position;
                    particle.bestFitness = fitness;
                }
                // Update global best
                if (fitness < globalBestFitness) {
                    globalBestPosition = particle.position;
                    globalBestFitness = fitness;
                }
            }
        }
    }

    // Update current candidate to the best found by PSO
    if (globalBestFitness < currFitness) {
        curr = globalBestPosition;
    }
}

void Solver::refinePriorities(PriorityRefinementMethod refinementMethod, Candidate& curr, int currFitness, double T) {
    switch (refinementMethod) {
        case PriorityRefinementMethod::NORMAL_PERTURBATION:
            refinePrioritiesNormal(curr, currFitness, T);
            return;
        case PriorityRefinementMethod::PARTICLE_SWARM_OPTIMIZATION:
            refinePrioritiesPSO(curr, currFitness, T);
            return;
        default:
            return;
    }
}