#!/usr/bin/env bash
##
# Script to process a single instance: convert, solve, and plot.
# Usage: ./solve.sh [INPUT_FILE]
# Example: ./solve.sh data/instances/dat/10.dat
##

set -euo pipefail  # Strict mode

# Get input file path (default: data/instances/dat/10.dat)
INPUT_FILE="${1:-data/instances/dat/10.dat}"
METHOD="random"  # Default solving method


# Check if file exists
if [ ! -f "${INPUT_FILE}" ]; then
  echo "Error: Input file '${INPUT_FILE}' not found!"
  exit 1
fi

# Extract instance name from input file (removes path and .dat extension)
INSTANCE=$(basename "${INPUT_FILE}" .dat)

echo "Processing instance: ${INSTANCE}"
echo "Input file: ${INPUT_FILE}"
echo "Solving method: ${METHOD}"
echo ""

echo "Setting up directories..."
# Remove json instances and csv results
mkdir -p data/instances/{tasks,networks} data/results/csv && \
  rm -rf data/instances/{tasks,networks}/* data/results/csv/*
echo "Done."
echo ""

# If it is needed to remove solver log, uncomment the following lines
#if [ -f "./solver/bin/solver_log.csv" ]; then
#   rm ./solver/bin/solver_log.csv
#fi

echo "Converting ${INPUT_FILE} to JSON..."
# Convert INPUT_FILE to absolute path or keep as-is if already absolute
if [[ "${INPUT_FILE}" = /* ]]; then
  # Already absolute path
  DAT_FILE="${INPUT_FILE}"
else
  # Relative path - make it relative to data/ directory where dat-to-json.js expects it
  # Remove 'data/' prefix if it exists
  DAT_FILE="${INPUT_FILE#data/}"
fi

node data/dat-to-json.js \
  -d "${DAT_FILE}" \
  -t "instances/tasks/t_${INSTANCE}.json" \
  -n "instances/networks/n_${INSTANCE}.json"

# Check if JSON files were created
if [ ! -f "data/instances/tasks/t_${INSTANCE}.json" ] || [ ! -f "data/instances/networks/n_${INSTANCE}.json" ]; then
  echo "Error: JSON files not created!"
  exit 1
fi

echo "Created files:"
echo " - data/instances/tasks/t_${INSTANCE}.json"
echo " - data/instances/networks/n_${INSTANCE}.json"
echo ""

echo "Compiling solver..."
make solver

# Tasks graph is in tasks/t_INSTANCE.json
# Network graph is in networks/n_INSTANCE.json
# Solving method is in METHOD variable
# Output is printed in CSV format
# Save output to results/csv/res_INSTANCE.csv
echo "Running solver..."
(cd solver && \
  ./bin/solve \
    -t "../data/instances/tasks/t_${INSTANCE}.json" \
    -n "../data/instances/networks/n_${INSTANCE}.json" \
    -s "${METHOD}" \
    -o csv > "../data/results/csv/res_${INSTANCE}.csv")

# If error when running the solver or a solution is not found, exit
if [ ! -s "data/results/csv/res_${INSTANCE}.csv" ]; then
  echo "Error: Result file not created or empty!"
  exit 1
fi

echo "Solver finished. Result saved to data/results/csv/res_${INSTANCE}.csv"
echo "Results:"
cat "data/results/csv/res_${INSTANCE}.csv"
echo ""

# Plot Gantt chart from CSV result
echo "Generating chart..."
source data/venv/bin/activate
python3 data/plot.py \
  "data/results/csv/res_${INSTANCE}.csv" \
  "data/charts/chart_${INSTANCE}.png"
deactivate

echo "=========================================="
echo "Instance processing completed."
echo "=========================================="