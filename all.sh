#!/bin/bash

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

    ./solver/bin/solve -t "$s" -n "$n" -s -o csv > "$out"

    if [ $? -eq 0 ]; then
      echo "Solved instance: tasks='$s', network='$n' -> result='$out'"
    else
      echo "Failed to solve instance: tasks='$s', network='$n'" >&2
    fi
  done
done

# Generate charts from results
source ./data/venv/bin/activate
mkdir -p "$charts_dir"
for r in "$results_dir"/*.csv; do
  if [ ! -s "$r" ]; then # skip empty result files
    continue
  fi
  out="$charts_dir/$(basename "$r" .csv)_gantt.png"
  python3 ./data/plot.py "$r" "$out"
done
deactivate
