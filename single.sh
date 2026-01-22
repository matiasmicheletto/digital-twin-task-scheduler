#!/usr/bin/env bash

## 
# Script to process a single instance: convert, solve, and plot.
# Usage: ./single.sh [INSTANCE_NUMBER]
##

set -euo pipefail # Strict mode

INSTANCE="${1:-10}" # By default 10.dat, else get from argument
METHOD="random"  # Default solving method

echo "Setting up directories..." # Remove json instances and csv results
mkdir -p data/instances/{tasks,networks} data/results/csv && \
rm -rf data/instances/{tasks,networks}/* data/results/csv/*
# If it is needed to remove solver log, uncomment the following lines
#if [ -f "./solver/bin/solver_log.csv" ]; then
#  rm ./solver/bin/solver_log.csv
#fi

echo "Converting DAT to JSON..."
node data/dat-to-json.js -d "instances/dat/${INSTANCE}.dat" -t "instances/tasks/t_${INSTANCE}.json" -n "instances/networks/n_${INSTANCE}.json"

echo "Solving instance..."
make solver
# Tasks graph is in tasks/t_INSTANCE.json
# Network graph is in networks/n_INSTANCE.json
# Solving method is in METHOD variable
# Output is printed in CSV format
# Save output to results/csv/res_INSTANCE.csv
./solver/bin/solve -t "data/instances/tasks/t_${INSTANCE}.json" -n "data/instances/networks/n_${INSTANCE}.json" -s "${METHOD}" -o csv > "data/results/csv/res_${INSTANCE}.csv"

# If error when running the solver or a solution is not found, exit
if [ ! -s "data/results/csv/res_${INSTANCE}.csv" ]; then
  echo "Error: Result file not created or empty!"
  exit 1
fi

# Plot Gantt chart from CSV result
echo "Generating chart..."
source data/venv/bin/activate
python3 data/plot.py "data/results/csv/res_${INSTANCE}.csv" "data/charts/chart_${INSTANCE}.png"
deactivate

echo "=========================================="
echo "Instance processing completed."
echo "=========================================="