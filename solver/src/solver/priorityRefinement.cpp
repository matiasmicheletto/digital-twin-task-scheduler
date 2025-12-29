#include "solver.h"

bool refinePrioritiesNormal(Candidate& c, double T) {
    /*
    double sigma = sigmaMax * (T / initialTemperature);

    Candidate trial = c;
    for (size_t i = 0; i < taskCount; ++i) {
        trial.priorities[i] += utils::randNormal(0, sigma);
        trial.priorities[i] = utils::clamp(trial.priorities[i], 0.0, 1.0);
    }

    if (scheduler.schedule(trial)) {
        int span = scheduler.getFinishTimeSum();
        if (span < currSpan) {
            c = trial;
            currSpan = span;
            return true;
        }
    }
    */
    return false;
}

bool refinePrioritiesPSO(Candidate& c, double T) {
    return false;
}

bool Solver::refinePriorities(PriorityRefinementMethod refinementMethod, Candidate& c, double T) {
    switch (refinementMethod) {
        case PriorityRefinementMethod::NORMAL_PERTURBATION:
            return refinePrioritiesNormal(c, T);
        case PriorityRefinementMethod::PARTICLE_SWARM_OPTIMIZATION:
            return refinePrioritiesPSO(c, T);
        default:
            return false;
    }
}