#!/usr/bin/env python3
"""
Real-Time System Schedule Validator

A Python program that validates the feasibility of schedules for real-time systems with precedence-related tasks running on interconnected servers.

It checks:
1. Pre-allocation constraints
2. Precedence constraints with communication delays
3. Server capacity (one task at a time)
4. Memory constraints
5. Timing constraints (deadlines)


## Overview

This program validates whether a given schedule meets all the constraints of a real-time system, including:
- Pre-allocation constraints
- Precedence constraints with communication delays
- Server capacity (one task at a time)
- Memory constraints
- Timing constraints (activation times and deadlines)
- Execution time matching WCET (Worst Case Execution Time)

## Requirements

- Python 3.6 or higher
- No external dependencies required (uses only standard library)

## Usage

```bash
python schedule_validator.py <system_file> <schedule_file>
```

### Example:
```bash
python schedule_validator.py system.txt schedule.csv
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

## Notes

- Task IDs start from 0
- Server IDs typically start from 1
- A pre-allocated server value of 0 means no pre-allocation
- Communication delay of 1000 conventionally means "no connection"
- All timing values are in abstract time slots

"""

import csv
import sys
from typing import Dict, List, Tuple, Set
from dataclasses import dataclass
from collections import defaultdict


@dataclass
class Server:
    """Represents a server in the system"""
    id: int
    memory: int
    utilization: float
    cost: float = 0.0


@dataclass
class Task:
    """Represents a task in the system"""
    id: int
    wcet: int  # Worst Case Execution Time
    period: int
    deadline: int
    activation: int
    memory: int
    preallocated_server: int  # 0 means no pre-allocation


@dataclass
class ScheduleEntry:
    """Represents a scheduled task"""
    task_id: int
    server_id: int
    start: int
    finish: int


class RealTimeSystemValidator:
    def __init__(self, system_file: str, schedule_file: str):
        self.system_file = system_file
        self.schedule_file = schedule_file
        self.servers: Dict[int, Server] = {}
        self.tasks: Dict[int, Task] = {}
        self.precedences: Dict[int, List[int]] = defaultdict(list)  # task -> list of successors
        self.delays: Dict[Tuple[int, int], int] = {}  # (server1, server2) -> delay
        self.schedule: List[ScheduleEntry] = []
        self.shortest_paths: Dict[Tuple[int, int], int] = {}
        
    def read_system_file(self):
        """Parse the system description file"""
        with open(self.system_file, 'r') as f:
            lines = [line.strip() for line in f.readlines()]
        
        line_idx = 0
        
        # Read number of servers
        n_servers = int(lines[line_idx])
        line_idx += 1
        
        # Read server information
        for i in range(n_servers):
            parts = lines[line_idx].split('\t')
            server_id = int(parts[0])
            memory = int(parts[1])
            utilization = float(parts[2])
            cost = float(parts[3]) if len(parts) > 3 else 0.0
            self.servers[server_id] = Server(server_id, memory, utilization, cost)
            line_idx += 1
        
        # Read last task id (which gives us M-1, where M is number of tasks)
        last_task_id = int(lines[line_idx])
        n_tasks = last_task_id + 1
        line_idx += 1
        
        # Read task information
        # Format: C (WCET), T (period), D (deadline), a (activation), M (memory), pre-allocated server
        for i in range(n_tasks):
            parts = lines[line_idx].split('\t')
            task_id = i
            wcet = int(parts[0])  # C - Worst Case Execution Time
            period = int(parts[1])  # T - Period
            deadline = int(parts[2])  # D - Deadline
            activation = int(parts[3])  # a - Activation time
            memory = int(parts[4])  # M - Required memory
            preallocated = int(parts[5]) if len(parts) > 5 else 0  # Pre-allocated server (0 = none)
            self.tasks[task_id] = Task(task_id, wcet, period, deadline, activation, memory, preallocated)
            line_idx += 1
        
        # Read number of precedences
        n_precedences = int(lines[line_idx])
        line_idx += 1
        
        # Read precedence relations
        for i in range(n_precedences):
            parts = lines[line_idx].split('\t')
            task1 = int(parts[0])
            task2 = int(parts[1])
            is_precedence = int(parts[2])
            if is_precedence == 1:
                self.precedences[task1].append(task2)
            line_idx += 1
        
        # Read number of connections
        n_connections = int(lines[line_idx])
        line_idx += 1
        
        # Read delay information
        for i in range(n_connections):
            parts = lines[line_idx].split('\t')
            server1 = int(parts[0])
            server2 = int(parts[1])
            delay = int(parts[2])
            self.delays[(server1, server2)] = delay
            line_idx += 1
        
        # Compute shortest paths using Floyd-Warshall
        self._compute_shortest_paths()
    
    def _compute_shortest_paths(self):
        """Compute shortest paths between all pairs of servers using Floyd-Warshall"""
        # Initialize with direct connections
        server_ids = list(self.servers.keys())
        
        # Initialize distances
        for s1 in server_ids:
            for s2 in server_ids:
                if s1 == s2:
                    self.shortest_paths[(s1, s2)] = 0
                elif (s1, s2) in self.delays:
                    self.shortest_paths[(s1, s2)] = self.delays[(s1, s2)]
                else:
                    self.shortest_paths[(s1, s2)] = float('inf')
        
        # Floyd-Warshall algorithm
        for k in server_ids:
            for i in server_ids:
                for j in server_ids:
                    if self.shortest_paths[(i, k)] + self.shortest_paths[(k, j)] < self.shortest_paths[(i, j)]:
                        self.shortest_paths[(i, j)] = self.shortest_paths[(i, k)] + self.shortest_paths[(k, j)]
    
    def read_schedule_file(self):
        """Parse the schedule CSV file"""
        with open(self.schedule_file, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                entry = ScheduleEntry(
                    task_id=int(row['task']),
                    server_id=int(row['server']),
                    start=int(row['start']),
                    finish=int(row['finish'])
                )
                self.schedule.append(entry)
        
        # Sort schedule by task_id for easier processing
        self.schedule.sort(key=lambda x: x.task_id)
    
    def validate_schedule(self) -> Tuple[bool, List[str]]:
        """
        Validate the complete schedule.
        Returns (is_feasible, messages) where messages contain detailed validation info.
        """
        messages = []
        is_feasible = True
        
        # Create a mapping from task_id to schedule entry
        task_schedule = {entry.task_id: entry for entry in self.schedule}
        
        # Check if all tasks are scheduled
        for task_id in self.tasks:
            if task_id not in task_schedule:
                messages.append(f"ERROR: Task {task_id} is not scheduled!")
                is_feasible = False
        
        if not is_feasible:
            return is_feasible, messages
        
        # Validate each task
        for task_id, entry in sorted(task_schedule.items()):
            task = self.tasks[task_id]
            task_messages = []
            task_ok = True
            
            task_messages.append(f"\n=== Task {task_id} ===")
            task_messages.append(f"  Scheduled on Server {entry.server_id}: [{entry.start}, {entry.finish}]")
            task_messages.append(f"  WCET: {task.wcet}, Deadline: {task.deadline}, Activation: {task.activation}")
            
            # Check 1: Pre-allocation constraint
            if task.preallocated_server != 0:
                if entry.server_id != task.preallocated_server:
                    task_messages.append(f"  ✗ FAIL: Task {task_id} must be allocated to server {task.preallocated_server}, but is allocated to {entry.server_id}")
                    task_ok = False
                    is_feasible = False
                else:
                    task_messages.append(f"  ✓ Pre-allocation constraint satisfied (server {task.preallocated_server})")
            else:
                task_messages.append(f"  ✓ No pre-allocation constraint")
            
            # Check 2: Execution time matches WCET
            actual_execution = entry.finish - entry.start
            if actual_execution != task.wcet:
                task_messages.append(f"  ✗ FAIL: Execution time {actual_execution} doesn't match WCET {task.wcet}")
                task_ok = False
                is_feasible = False
            else:
                task_messages.append(f"  ✓ Execution time matches WCET ({task.wcet})")
            
            # Check 3: Task starts after activation time
            if entry.start < task.activation:
                task_messages.append(f"  ✗ FAIL: Task starts at {entry.start} before activation time {task.activation}")
                task_ok = False
                is_feasible = False
            else:
                task_messages.append(f"  ✓ Starts after activation time ({task.activation})")
            
            # Check 4: Deadline constraint
            if entry.finish > task.activation + task.deadline:
                task_messages.append(f"  ✗ FAIL: Task finishes at {entry.finish}, exceeds deadline {task.activation + task.deadline}")
                task_ok = False
                is_feasible = False
            else:
                task_messages.append(f"  ✓ Meets deadline (finish: {entry.finish} <= {task.activation + task.deadline})")
            
            # Check 5: Memory constraint
            server = self.servers[entry.server_id]
            if task.memory > server.memory:
                task_messages.append(f"  ✗ FAIL: Task requires {task.memory} memory, server has only {server.memory}")
                task_ok = False
                is_feasible = False
            else:
                task_messages.append(f"  ✓ Memory constraint satisfied ({task.memory} <= {server.memory})")
            
            # Check 6: Precedence constraints
            if task_id in self.precedences:
                for successor_id in self.precedences[task_id]:
                    if successor_id in task_schedule:
                        successor_entry = task_schedule[successor_id]
                        
                        # Calculate required delay
                        delay = self.shortest_paths.get((entry.server_id, successor_entry.server_id), float('inf'))
                        
                        if delay == float('inf'):
                            task_messages.append(f"  ✗ FAIL: No path from server {entry.server_id} to {successor_entry.server_id} for successor task {successor_id}")
                            task_ok = False
                            is_feasible = False
                        else:
                            earliest_start = entry.finish + delay
                            if successor_entry.start < earliest_start:
                                task_messages.append(f"  ✗ FAIL: Successor task {successor_id} starts at {successor_entry.start}, must wait until {earliest_start} (finish {entry.finish} + delay {delay})")
                                task_ok = False
                                is_feasible = False
                            else:
                                task_messages.append(f"  ✓ Precedence constraint with task {successor_id} satisfied (delay: {delay}, successor starts: {successor_entry.start} >= {earliest_start})")
            
            messages.extend(task_messages)
        
        # Check 7: Server capacity (no overlapping tasks on same server)
        messages.append("\n=== Server Capacity Check ===")
        server_tasks = defaultdict(list)
        for entry in self.schedule:
            server_tasks[entry.server_id].append(entry)
        
        for server_id, tasks_on_server in server_tasks.items():
            tasks_on_server.sort(key=lambda x: x.start)
            messages.append(f"\nServer {server_id}:")
            for i, entry in enumerate(tasks_on_server):
                if i > 0:
                    prev_entry = tasks_on_server[i-1]
                    if entry.start < prev_entry.finish:
                        messages.append(f"  ✗ FAIL: Task {entry.task_id} [{entry.start}, {entry.finish}] overlaps with task {prev_entry.task_id} [{prev_entry.start}, {prev_entry.finish}]")
                        is_feasible = False
                    else:
                        messages.append(f"  ✓ Task {entry.task_id} [{entry.start}, {entry.finish}] - no overlap")
                else:
                    messages.append(f"  ✓ Task {entry.task_id} [{entry.start}, {entry.finish}] - first task")
        
        return is_feasible, messages
    
    def run(self):
        """Main execution method"""
        print("=" * 70)
        print("Real-Time System Schedule Validator")
        print("=" * 70)
        
        try:
            # Read input files
            print(f"\nReading system file: {self.system_file}")
            self.read_system_file()
            print(f"  - Loaded {len(self.servers)} servers")
            print(f"  - Loaded {len(self.tasks)} tasks")
            print(f"  - Computed shortest paths between servers")
            
            print(f"\nReading schedule file: {self.schedule_file}")
            self.read_schedule_file()
            print(f"  - Loaded {len(self.schedule)} scheduled tasks")
            
            # Validate schedule
            print("\n" + "=" * 70)
            print("Validating Schedule")
            print("=" * 70)
            
            is_feasible, messages = self.validate_schedule()
            
            # Print validation results
            for message in messages:
                print(message)
            
            # Print final result
            print("\n" + "=" * 70)
            if is_feasible:
                print("RESULT: Schedule is FEASIBLE ✓")
                print("All constraints are satisfied.")
            else:
                print("RESULT: Schedule is NOT FEASIBLE ✗")
                print("Some constraints are violated (see above).")
            print("=" * 70)
            
            return is_feasible
            
        except Exception as e:
            print(f"\nERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            return False


def main():
    if len(sys.argv) != 3:
        print("Usage: python schedule_validator.py <system_file> <schedule_file>")
        print("\nExample:")
        print("  python schedule_validator.py system.txt schedule.csv")
        sys.exit(1)
    
    system_file = sys.argv[1]
    schedule_file = sys.argv[2]
    
    validator = RealTimeSystemValidator(system_file, schedule_file)
    is_feasible = validator.run()
    
    sys.exit(0 if is_feasible else 1)


if __name__ == "__main__":
    main()