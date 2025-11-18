#!/bin/bash

tasks_dir="data/generated-tasks"
nets_dir="data/generated-networks"
results_dir="data/schedules"
charts_dir="data/charts"

# Generate dataset
cd data
./make-dataset.sh
cd ..

# Solve all instances and save results
make --trace solver
for s in "$tasks_dir"/*.json; do
  for n in "$nets_dir"/*.json; do
    base_s=$(basename "$s" .json)
    base_n=$(basename "$n" .json)

    out_random="$results_dir/${base_s}__${base_n}_random.csv"
    out_annealing="$results_dir/${base_s}__${base_n}_annealing.csv"

    ./solver/bin/solve -t "$s" -n "$n" -s random -o csv > "$out_random"
    if [ $? -eq 0 ]; then
      echo "Solved instance: tasks='$s', network='$n' -> result='$out_random'"
    else
      echo "Failed to solve instance: tasks='$s', network='$n'" >&2
    fi

    ./solver/bin/solve -t "$s" -n "$n" -s annealing -o csv > "$out_annealing"
    if [ $? -eq 0 ]; then
      echo "Solved instance: tasks='$s', network='$n' -> result='$out_annealing'"
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
