#include "solver.h"

void Solver::refinePrioritiesNormal(Candidate& curr, int currFitness, double T) {
    double sigma = config.sa_sigmaMax * (T / config.sa_initialTemperature);

    // For each task, perturb its priority with a normal distribution
    Candidate trial = curr;
    for(int iter = 0; iter < config.sa_refinementIterations; ++iter){
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
            }
        }
    }
}

void Solver::refinePrioritiesPSO(Candidate& curr, int currFitness, double T) {
    
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