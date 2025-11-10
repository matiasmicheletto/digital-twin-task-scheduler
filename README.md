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
./solve -t tasks.json -n network.json
```

5. Visualize schedule. Run solver with `-o csv` to generate `schedule.csv`, then:
```bash
cd data
virtualenv venv
source venv/bin/activate
pip install -r requirements.txt
python gantt.py schedule.csv
```
