#!/usr/bin/env bash
set -euo pipefail # Strict mode

INSTANCE="${1:-10}"

echo "Setting up directories..."

rm -rf data/instances/tasks
rm -rf data/instances/networks
rm -rf data/results/csv

mkdir -p data/instances/tasks
mkdir -p data/instances/networks
mkdir -p data/results/csv

echo "Converting DAT to JSON..."
node data/dat-to-json.js -d "instances/dat/${INSTANCE}.dat" -t "instances/tasks/t_${INSTANCE}.json" -n "instances/networks/n_${INSTANCE}.json"

echo "Solving instance..."
make solver
./solver/bin/solve -t "../data/instances/tasks/t_${INSTANCE}.json" -n "data/instances/networks/n_${INSTANCE}.json" -o csv > "data/results/csv/res_${INSTANCE}.csv"

if [ ! -s "data/results/csv/res_${INSTANCE}.csv" ]; then
  echo "Error: Result file not created or empty!"
  exit 1
fi

echo "Generating chart..."
source data/venv/bin/activate
python3 data/plot.py "data/results/csv/res_${INSTANCE}.csv" "data/charts/chart_${INSTANCE}.png"
deactivate

echo "=========================================="
echo "Single instance processing completed."
echo "=========================================="