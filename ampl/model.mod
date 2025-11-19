# model.mod
# MILP Model for scheduling with precedences and communication delays.

set TASKS;
set SERVERS;

set PRE within TASKS cross TASKS;  # (h,i) pairs of tasks with precedence tau_h < tau_i

param C{TASKS} integer >= 0;      # WCET
param T{TASKS} integer >= 1;      # Period
param D{TASKS} integer >= 0;      # Relative deadline
param Mreq{TASKS} integer >= 0;   # Memory requirement
param util{TASKS} >= 0;              # Utilization u_i = C_i/T_i
param U{SERVERS} >= 0;            # CPU capacity (max. utilization)
param MEM{SERVERS} >= 0;          # Memory capacity
param Delta{SERVERS, SERVERS} >= 0;# Communication delay between servers
param alpha >= 0;
param beta >= 0;
param BigM >= 0 integer;          # Big-M
param r{TASKS} default 0;         # Release time (0 by default)

# Variables
var L{TASKS, SERVERS} binary;     # 1 if task i is allocated to server s
var delta{TASKS, TASKS} binary;   # 1 if task i runs before than j in the same server
var psi{TASKS, TASKS, SERVERS, SERVERS} binary; # predecessor(h) to successor(i) allocations to servers u,v
var s{TASKS} integer >= 0;        # Start time
var f{TASKS} integer >= 0;        # Finish time

# Start/finish relationship (no-preemptive)
s.t. finish_def{i in TASKS}:
    f[i] = s[i] + C[i];

# Deadlines
s.t. deadlines{i in TASKS}:
    f[i] <= r[i] + D[i];

# Each task assigned to exactly one server
s.t. one_server{i in TASKS}:
    sum{v in SERVERS} L[i,v] = 1;

# CPU capacity
s.t. cpu_cap{v in SERVERS}:
    sum{i in TASKS} L[i,v] * util[i] <= U[v];

# Memory capacity
s.t. mem_cap{v in SERVERS}:
    sum{i in TASKS} L[i,v] * Mreq[i] <= MEM[v];

# Non-overlap (i before j) - if delta[i,j] = 1, then s[j] >= f[i]
s.t. no_overlap_i_before_j{i in TASKS, j in TASKS: i != j}:
    s[j] >= f[i] - BigM * (1 - delta[i,j]);

# Non-overlap (j before i) - if delta[j,i] = 1, then s[i] >= f[j]
s.t. no_overlap_j_before_i{i in TASKS, j in TASKS: i != j}:
    s[i] >= f[j] - BigM * (1 - delta[j,i]);

# Ordering consistency: if i and j are on same server v, one must precede the other
s.t. order_consistency{i in TASKS, h in TASKS, v in SERVERS: i != h}:
    L[i,v] + L[h,v] - 1 <= delta[i,h] + delta[h,i];

# Forcing constraint: psi[h,i,u,v] must be 1 if L[h,u]=1 and L[i,v]=1
s.t. psi_forcing{ (h,i) in PRE, u in SERVERS, v in SERVERS }:
    psi[h,i,u,v] >= L[h,u] + L[i,v] - 1;

# Upper bounds (Original psi_max1 and psi_max2 are kept)
s.t. psi_max1{ (h,i) in PRE, u in SERVERS, v in SERVERS }:
    psi[h,i,u,v] <= L[h,u];
    
s.t. psi_max2{ (h,i) in PRE, u in SERVERS, v in SERVERS }:
    psi[h,i,u,v] <= L[i,v];

# Communication delays for precedence constraints (Handles both 0 and >0 delay cases)
s.t. precedence_comm{ (h,i) in PRE, u in SERVERS, v in SERVERS }:
    s[i] >= f[h] + Delta[u,v] - BigM * (1 - psi[h,i,u,v]);

    
# Objective function
minimize OBJ:
    sum{i in TASKS} f[i];
