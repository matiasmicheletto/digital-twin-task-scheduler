#ifndef SOLVER_H
#define SOLVER_H

#include "scheduler.h"

class Solver {
public:
    Solver(Scheduler& sch) : scheduler(sch) {}

    void solve();

private: 
    Scheduler& scheduler;
};


#endif // SOLVER_H