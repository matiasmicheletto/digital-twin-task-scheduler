#ifndef SERVER_H
#define SERVER_H

#include "json.hpp"

struct Server {
    int id;
    int memory; // Total memory
    int utilization; // 0-1
    int last_slot;

};

#endif // SERVER_H