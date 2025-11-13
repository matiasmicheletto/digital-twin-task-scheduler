#ifndef SOLVER_H
#define SOLVER_H

#include "digital_twin.h"

class Solver {
public:
    Solver(DigitalTwin& dt) : digital_twin(dt) {}

    void solve();

private: 
    DigitalTwin& digital_twin;
};


#endif // SOLVER_H