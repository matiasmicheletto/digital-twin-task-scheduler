# Digital Twin Task Scheduler

A comprehensive tool for generating, solving, and visualizing task scheduling problems in mist-edge-cloud computing environments. This project includes a graphical user interface for instance generation, a C++ solver implementing various scheduling algorithms, and python based data visualization for computed solutions.

## Features
- Generate tasks and network configurations via a graphical interface.
- Automatic generation of large datasets of instances in different formats.
- C++ solvers for scheduling tasks based on various algorithms (simulated annealing, random search, genetic algorithms).
- CPLEX integration for solving scheduling problems using ILP.
- Data visualization and analysis tools.

## Stack
- **Frontend**: JavaScript, Vite, React
- **Backend**: C++17, Node.js, Python, CPLEX
- **Data Visualization**: Python, Matplotlib
- **Task automations**: Bash, Node.js, Python

## Installation
To build the project, ensure you have a C++ compiler and CMake installed.  
Also install the following dependencies:  

Arch / Manjaro:
  sudo pacman -S yaml-cpp

Debian / Ubuntu:
  sudo apt install libyaml-cpp-dev

Fedora:
  sudo dnf install yaml-cpp-devel

## Getting Started
Follow these steps to generate instances, run the solver, and visualize the results:

1. Clone the repository:
```bash
git clone https://github.com/matiasmicheletto/digital-twin-task-scheduler.git
cd digital-twin-task-scheduler
```

2. Generate instances using the graphical interface:
```bash
cd gui
npm install
npm run build
npm start
cd ..
```
Open your browser and navigate to `http://localhost:5173` to access the GUI. Or use the pre-built version in the `dist` folder.

3. To generate large datasets of instances automatically (See scripts help manuals for custom presets):
```bash
cd data
npm install
node instance-generator.js presets
node network-generator.js --batch presets
cd ..
```

4. Compile and run solver (for instance, using simulated annealing):
```bash
cd solver
make
cd bin
./solve -t tasks.json -n network.json -c config.yaml -s annealing -o json
```
To save a csv file, use `-o csv` instead of `-o json`:
```bash
./solve -t tasks.json -n network.json -c config.yaml -s annealing -o csv > ../../data/schedule.csv
``` 

5. Visualize schedule. Run solver with `-o csv`, then:
```bash
cd data
virtualenv venv
source venv/bin/activate
pip install -r requirements.txt
python plot.py schedule.csv
```

## Usage
The entire process can be automated using the provided `all.sh` script, which covers instance generation, solving, and visualization. Before running the script, ensure to:

1. Define preset parameters for tasks and network generation in the `shared/presets` folder.
2. Check directories in the header of the `all.sh` script.


## Data format
Instances can be generated using the GUI or the automatic generators. They consist of two JSON files: one for tasks and another for the network. There is also a tool to combine both data structures into a single .dat file to solve the instance with ILP optimizers.  

Automatic generators and format converters are located in the [shared](shared) folder. The [data](data) folder contains node scripts to access these generators and create datasets. To automate the generation of large datasets, use the [generate.sh](data/generate.sh) script.

### Tasks
Tasks are represented in JSON format with the following structure:
```jsonc
{
    "tasks":[
        {
            "id": "11ed2bef", // Unique identifier
            "type": "TASK", // For visualization purposes only
            "label": "Task 0", // Label for easy task identifying
            "mist": false, // If this task will be allocated to a mist node, cannot have predecessors
            "C": 1, // Execution time
            "T": 80, // Period
            "D": 80, // Deadline (usually equal to period, but configurable)
            "a": 0, // Activation time
            "M": 1, // Memory requirement
            "processorId": null, // If task is fixed preallocated to a specific node, this ID corresponds to the node ID
            "successors": [ // List of the IDs of the successor tasks
                "507adb48",
                "a3f5c6e2"
            ],
            "position": { // Used to draw the network
                "x": 490.86759826529646,
                "y": 365.87258340285246
            }
        }
    ],
    "precedences": [
        {
            "id": "11ed2bef_507adb48", // Unique identifier
            "from": "11ed2bef", // ID of predecessor task
            "to": "507adb48", // ID of succesor task
        }
    ]
}
```

### Network
Network consists of nodes and connections represented in JSON format with the following structure:
```jsonc
{
    "nodes":[
        {
            "id": "983cb790", // Unique identifier
            "type": "MIST", // Type can be MIST, EDGE or CLOUD
            "label": "Mist 3", // Label for easy node identifying
            "tasks": [], // List of preallocated tasks
            "memory": 5, // Available memory
            "u": 0.7217552226492681, // Maximum utilization factor available
            "links": [ // List of connections to other nodes, reduntant as they are also in the global connections list
                {
                "id": "983cb790_b1996e39", // Unique link identifier (usually idFrom_idTo)
                "label": "Mist 3 → Edge 1", // Label for easy link identifying
                "sourceId": "983cb790", // ID of the source node
                "targetId": "b1996e39", // ID of the target node
                "delay": 3, // Delay of the link in time slots
                "bidirectional": false // If data can be sent back and forth or not
                }
            ],
            "position": { // Used to draw the network
                "x": 144,
                "y": 163
            }
        }
    ],
   "connections": [
        {
            "id": "9acd628d_af0ac5f7", // Unique identifier
            "label": "Mist 1 → Edge 5", // Label for easy link identifying
            "from": "9acd628d", // ID of the source node
            "to": "af0ac5f7", // ID of the target node
            "delay": 8, // Delay of the link in time slots
            "bidirectional": false // If data can be sent back and forth or not
        }
    ]
};
```

### Optimization options
Optimization options can be specified in a YAML configuration file with the following structure:

```yaml
tunning:
  alpha: 1
  beta: 1
simulated_annealing:
  max_init_tries: 5000
  max_iterations: 3000
  timeout: 3600
  stagnation_limit: 200
  max_neighbor_tries: 30
  initial_temperature: 150.0
  cooling_rate: 0.995
  min_temperature: 1.0e-3
  refinement_priority_method: NORMAL
  refinement_iterations: 50
  refinement_sigma_max: 0.1
  refinement_sigma_min: 1.0e-3
  refinement_pso_warm_size: 30
  refinement_pso_velocity_clamp: 2
  refinement_pso_inertia_weight: 0.5
  refinement_pso_cognitive_coef: 1.5
  refinement_pso_social_coef: 1.5

random_search:
  max_iterations: 5000
  timeout: 3600
  stagnation_limit: 200
  break_on_first_feasible: false

genetic_algorithm:
  population_size: 150
  max_generations: 800
  timeout: 3600
  elite_count: 5
  stagnation_limit: 200
  mutation_rate: 0.15
  crossover_rate: 0.75
```

### CPLEX Integration

The following format is used to combine tasks and network data into a single .dat file for solving with CPLEX.

```txt
N (number of processors)
nodeId (from 1)    memory    u
...
M (number of tasks)
taskId (from 0)   C    T    D    a    M    allocatedProcessor (if preallocated, otherwise 0)
...
P (M x M, precedence matrix)
fromTaskId    toTaskId    exists (1/0)
...
S (N x N, processors connection matrix)
fromNodeId    toNodeId    delay
```


### Solver

The [Makefile](solver/Makefile) contains instructions to compile the C++ solvers. Entry points must be located in the [solver/src](solver/src) folder with `_main.cpp` suffix. The compiled binaries can be found in the [solver/bin](solver/bin) folder.

Read the [manual](solver/assets/solve_manual.txt) for detailed instructions on how to use the solver.

### Results
The solver can output results in three formats: text, JSON, and CSV. The CSV format is particularly useful for visualizing schedules using the provided Python script in the [data](data) folder. The script generates Gantt charts to represent task allocations over time.