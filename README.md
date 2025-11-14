# Digital Twin Task Scheduler

This project implements a task scheduling system for digital twin environments. It provides functionalities to model tasks and servers, and to schedule tasks efficiently across available servers.

## Features
- Generate tasks and network configurations via a graphical interface.
- Automatic generation of large datasets of instances.
- C++ solver for scheduling tasks based on various algorithms.
- Data visualization and analysis tools.

## Stack
- **Frontend**: JavaScript, Vite, React
- **Backend**: C++17, Node.js
- **Data Visualization**: Python, Matplotlib
- **Task automations**: Bash, Node.js

## Installation
To build the project, ensure you have a C++ compiler and CMake installed. 

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

3. Generate large datasets of instances automatically (See scripts help manuals for custom presets):
```bash
cd data
npm install
node instance-generator.js presets
node network-generator.js --batch presets
cd ..
```

4. Run solver:
```bash
cd solver
make
cd bin
./solve -t tasks.json -n network.json -s -o json
```

5. Visualize schedule. Run solver with `-o csv` to generate `schedule.csv`, then:
```bash
cd data
virtualenv venv
source venv/bin/activate
pip install -r requirements.txt
python plot.py schedule.csv
```


## Data format
Instances can be generated using the GUI or the automatic generators. They consist of two JSON files: one for tasks and another for the network. There is also a tool to combine both data structures into a single .dat file to solve the instance with ILP optimizers.  

Automatic generators are located in the [shared](shared) folder. The [data](data) folder contains node scripts to access these generators and create datasets. To automate the generation of large datasets, use the [generate.sh](data/generate.sh) script.

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

### Solver

The [Makefile](solver/Makefile) contains instructions to compile the C++ solvers. Entry points must be located in the [solver/src](solver/src) folder with `_main.cpp` suffix. The compiled binaries can be found in the [solver/bin](solver/bin) folder.

Read the [manual](solver/assets/solve_manual.txt) for detailed instructions on how to use the solver.

### Results
The solver can output results in three formats: text, JSON, and CSV. The CSV format is particularly useful for visualizing schedules using the provided Python script in the [data](data) folder. The script generates Gantt charts to represent task allocations over time.

To visualize a schedule, run the solver with the `-o csv` option and pass the output to a .csv file, for example:

```bash
cd solver # Go to solver folder
make # Build the solver
./bin/solve -t tasks.json -n network.json -o csv > ../data/schedule.csv # Run solver and pass output to .csv file
cd ../data # Go to data folder
virtualenv venv # Create virtual environment
source venv/bin/activate # Activate virtual environment
pip install -r requirements.txt # Install dependencies (matplotlib)
python plot.py schedule.csv # Generate Gantt chart
deactivate # Deactivate virtual environment
```