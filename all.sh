#!bin/bash

tasks_dir="data/generated-tasks"
nets_dir="data/generated-networks"
results_dir="data/schedules"
charts_dir="data/charts"

# Generate dataset
./data/make-dataset.sh

# Solve all instances and save results
make --trace solver
for s in "$tasks_dir"/*.json; do
  for n in "$nets_dir"/*.json; do
    base_s=$(basename "$s" .json)
    base_n=$(basename "$n" .json)

    out="$results_dir/${base_s}__${base_n}.csv"

    .solver/bin/solve -s "$s" -n "$n" -s -o csv > "$out"
  done
done

# Generate charts from results
source ./data/venv/bin/activate
python3 data/make-charts.py --input-dir "$results_dir" --output-dir "$charts_dir"
deactivate
