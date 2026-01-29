This Python program validates the feasibility of computed schedules.

## Overview

This program validates whether a given schedule meets all the constraints of a real-time system, including:
- Pre-allocation constraints
- Precedence constraints with communication delays
- Server capacity (one task at a time)
- Memory constraints
- Timing constraints (activation times and deadlines)
- Execution time matching WCET (Worst Case Execution Time)


## Usage

```bash
python validator.py <instance_file> <schedule_file>
```

### Example:
```bash
python validator.py instance.dat schedule.csv
```

## Input File Formats

### System File Format (tab-separated text file)

The system file describes the real-time system parameters:

1. **Line 1**: Number of servers (N)
2. **Lines 2 to N+1**: Server information
   - Format: `id<TAB>memory<TAB>utilization<TAB>cost`
   - id: Server ID (1 to N)
   - memory: Available memory
   - utilization: Initial utilization (0.0 to 1.0)
   - cost: Cost of using the server

3. **Line N+2**: Last task ID (M-1, where M is the number of tasks)

4. **Lines N+3 to N+M+2**: Task attributes
   - Format: `C<TAB>T<TAB>D<TAB>a<TAB>M<TAB>server`
   - C: Worst Case Execution Time (WCET)
   - T: Period
   - D: Deadline
   - a: Activation time
   - M: Required memory
   - server: Pre-allocated server (0 means no pre-allocation)

5. **Line N+M+3**: Number of precedence relations (P = M×M)

6. **Lines N+M+4 to N+M+P+3**: Precedence matrix
   - Format: `task1<TAB>task2<TAB>is_precedence`
   - is_precedence: 1 if task1 precedes task2, 0 otherwise

7. **Line N+M+P+4**: Number of server connections (S = N×N)

8. **Lines N+M+P+5 to end**: Communication delays
   - Format: `server1<TAB>server2<TAB>delay`
   - delay: Communication delay (1000 means no connection)

### Schedule File Format (CSV)

The schedule file specifies when and where each task executes:

```csv
task,server,start,finish
0,1,0,10
1,2,0,42
...
```

- **task**: Task ID
- **server**: Server ID where task executes
- **start**: Start time slot
- **finish**: Finish time slot

## Validation Checks

The program performs the following validations for each task:

### 1. Pre-allocation Constraint
- If a task is pre-allocated to a specific server, it must be scheduled on that server

### 2. Execution Time
- The actual execution time (finish - start) must match the task's WCET

### 3. Activation Time
- Tasks cannot start before their activation time

### 4. Deadline Constraint
- Tasks must finish before their deadline (activation + deadline)

### 5. Memory Constraint
- The task's memory requirement must not exceed the server's available memory

### 6. Precedence Constraints
- If task A precedes task B, then B must start after A finishes plus the communication delay
- Communication delays are calculated using shortest paths between servers (Floyd-Warshall algorithm)

### 7. Server Capacity
- No two tasks can execute simultaneously on the same server (no overlapping time slots)

## Output

The program provides detailed output for each task, showing:
- Task allocation and timing
- Which constraints are satisfied (✓) or violated (✗)
- Specific reasons for any failures

### Example Output:

```
=== Task 0 ===
  Scheduled on Server 1: [0, 10]
  WCET: 10, Deadline: 488, Activation: 0
  ✓ Pre-allocation constraint satisfied (server 1)
  ✓ Execution time matches WCET (10)
  ✓ Starts after activation time (0)
  ✓ Meets deadline (finish: 10 <= 488)
  ✓ Memory constraint satisfied (5 <= 12)
  ✓ Precedence constraint with task 3 satisfied (delay: 5, successor starts: 69 >= 15)

=== Server Capacity Check ===
Server 1:
  ✓ Task 0 [0, 10] - first task

RESULT: Schedule is FEASIBLE ✓
All constraints are satisfied.
```

If any constraint is violated, the program will show:
```
✗ FAIL: [Detailed error message]
RESULT: Schedule is NOT FEASIBLE ✗
```

## Exit Codes

- **0**: Schedule is feasible
- **1**: Schedule is not feasible or an error occurred

## Algorithm Details

### Shortest Path Calculation
The program uses the **Floyd-Warshall algorithm** to compute shortest paths between all pairs of servers. This is necessary because:
- Not all servers are directly connected
- Communication delays must account for the shortest path through intermediate servers
- A delay of 1000 indicates no direct connection

### Validation Flow
1. Parse system file (servers, tasks, precedences, delays)
2. Compute shortest paths between all server pairs
3. Parse schedule file
4. For each scheduled task:
   - Verify pre-allocation
   - Check execution time
   - Validate timing constraints
   - Check memory availability
   - Verify precedence relations
5. Check server capacity (no overlaps)
6. Report overall feasibility

## Example Files

The repository includes example files:
- `system.txt`: Example system description with 4 servers and 10 tasks
- `schedule.csv`: Example schedule file

## Error Handling

The program includes comprehensive error handling:
- File not found errors
- Malformed input files
- Missing tasks in schedule
- Invalid server or task IDs
- Unreachable servers (infinite delay)