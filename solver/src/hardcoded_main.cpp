#include <iostream>
#include <cstring>

#include "../include/digital_twin.h"
#include "../include/solver.h"


int main(int argc, char **argv) {

    DigitalTwin dt("./test/sch-instance.json", "./test/nw-instance.json");

    const Candidate candidate{
            .server_indices = {0, 1, 2, 0, 1, 2, 3},
            .priorities = {1.0, 0.5, 0.8, 1.0, 0.2, 0.33, 1.4}
        };

    dt.schedule(candidate);

    dt.print(utils::PRINT_TYPE::SCHEDULE_CSV);

    return 0;
}

