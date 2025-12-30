#include "solver.h"

void Solver::refinePrioritiesNormal(Candidate& c, double T, int currFitness) {
    double sigma = config.sa_sigmaMax * (T / config.sa_initialTemperature);

    Candidate trial = c;
    for (size_t i = 0; i < scheduler.getTaskCount(); ++i) {
        trial.priorities[i] += utils::randNormal(0, sigma);
        trial.priorities[i] = utils::clamp(trial.priorities[i], 0.0, 1.0);
    }

    if (scheduler.schedule(trial)) {
        int fitness = scheduler.getFinishTimeSum();
        if (fitness < currFitness) {
            c = trial;
            currFitness = fitness;
        }
    }
}

void Solver::refinePrioritiesPSO(Candidate& c, double T, int currFitness) {
    
}

void Solver::refinePriorities(PriorityRefinementMethod refinementMethod, Candidate& c, double T, int currFitness) {
    switch (refinementMethod) {
        case PriorityRefinementMethod::NORMAL_PERTURBATION:
            refinePrioritiesNormal(c, T, currFitness);
            return;
        case PriorityRefinementMethod::PARTICLE_SWARM_OPTIMIZATION:
            refinePrioritiesPSO(c, T, currFitness);
            return;
        default:
            return;
    }
}