#!/usr/bin/env bash

##
# Script to process all instances: convert, solve with multiple methods, and plot.
# Usage: ./all.sh
##

set -euo pipefail # Strict mode

# Instances directories
# Task and network JSON files will be generated from DAT files
DAT_DIR="data/instances/dat"
TASKS_DIR="data/instances/tasks"
NETS_DIR="data/instances/networks"

RESULTS_CSV_DIR="data/results/csv"
RESULTS_CPLEX_DIR="data/results/cplex"
RESULTS_AMPL_DIR="data/results/ampl"
CHARTS_DIR="data/charts"

# Flags to enable/disable ILP solvers
RUN_CPLEX=false
RUN_AMPL=false

VENV_PATH="data/venv"
RUNTIME_FILE="data/results/runtimes.txt"



echo "=========================================="
echo "Setting up directories"
echo "=========================================="
mkdir -p \
  "$RESULTS_CSV_DIR" \
  "$RESULTS_CPLEX_DIR" \
  "$RESULTS_AMPL_DIR" \
  "$CHARTS_DIR" \
  "$TASKS_DIR" \
  "$NETS_DIR"

: > "$RUNTIME_FILE"
# Clear solver log if exists
if [ -f "./solver/bin/solver_log.csv" ]; then
  rm ./solver/bin/solver_log.csv
fi

rm -f "$RESULTS_CSV_DIR"/*.csv
rm -f "$CHARTS_DIR"/*

shopt -s nullglob # Make globs return empty if no matches



echo "=========================================="
echo "Building heuristic solver"
echo "=========================================="
make solver


echo "=========================================="
echo "Converting DAT to JSON and solving instances"
echo "=========================================="
for dat_file in "$DAT_DIR"/*.dat; do # For each instance DAT file
    
    # Extract the filename without the path and extension (e.g., "40")
    filename=$(basename "$dat_file" .dat)
    
    echo "Processing $filename..."

    # Define the output paths based on the filename
    dat_abs=$(realpath "$dat_file")
    net_output=$(realpath "$NETS_DIR")/net${filename}.json
    task_output=$(realpath "$TASKS_DIR")/sched${filename}.json

    # Execute the node command to convert DAT to JSON
    node data/dat-to-json.js -d "$dat_abs" -n "$net_output" -t "$task_output"

    # Prepare absolute paths for solver input
    base_t="sched${filename}"
    base_n="net${filename}"
    t_abs=$(realpath "$TASKS_DIR/$base_t.json")
    n_abs=$(realpath "$NETS_DIR/$base_n.json")

    # Now run the solver with different strategies
    for strategy in random annealing genetic; do
      out="$RESULTS_CSV_DIR/${base_t}__${base_n}_${strategy}.csv"

      echo "Heuristic [$strategy]: $base_t / $base_n"

      if (
        cd "$(dirname "$0")" && \
        ./solver/bin/solve \
          -t "$t_abs" \
          -n "$n_abs" \
          -s "$strategy" \
          -o csv
      ) > "$out"; then
        # Check if the output file is non-empty
        if [ ! -s "$out" ]; then
          echo "FAIL -> $base_t / $base_n ($strategy): Empty output file" >&2
          rm -f "$out"
          continue
        fi
        echo "OK  -> $out"
      else
        echo "FAIL -> $base_t / $base_n ($strategy)" >&2
        rm -f "$out"
      fi
    done
done

# Run AMPL solver for each instance if enabled
if [[ "${RUN_AMPL:-false}" == true ]]; then
  echo "=========================================="
  echo "Running AMPL solver"
  echo "=========================================="

  # Check if AMPL is installed
  if command -v ampl >/dev/null 2>&1; then
    for dat in "$DAT_DIR"/*.dat; do
      base=$(basename "$dat" .dat)
      out="$RESULTS_AMPL_DIR/${base}_ampl.out"

      echo "AMPL: $base"

      start=$(date +%s)

      if ampl <<EOF > "$out"; then
model ampl/model.mod;
data $dat;

option solver gurobi;
option gurobi_options "timelimit=180";

solve;
display s, f, L;
EOF
        end=$(date +%s)
        echo "ampl $base $((end - start))s" >> "$RUNTIME_FILE"
        echo "OK  -> $out"
      else
        echo "FAIL -> AMPL $base" >&2
        rm -f "$out"
      fi
    done
  else
    echo "AMPL not found — skipping"
  fi
fi

# Run CPLEX solver for each instance if enabled
if [[ "${RUN_CPLEX:-false}" == true ]]; then
  echo "=========================================="
  echo "Running CPLEX solver"
  echo "=========================================="

  if command -v cplex >/dev/null 2>&1; then
    for dat in "$DAT_DIR"/*.dat; do
      base=$(basename "$dat" .dat)
      sol="$RESULTS_CPLEX_DIR/${base}_cplex.sol"

      echo "CPLEX: $base"

      start=$(date +%s)

      if cplex -c \
          "read $dat" \
          "optimize" \
          "write $sol sol" \
          "quit"; then
        end=$(date +%s)
        echo "cplex $base $((end - start))s" >> "$RUNTIME_FILE"
        echo "OK  -> $sol"
      else
        echo "FAIL -> CPLEX $base" >&2
        rm -f "$sol"
      fi
    done
  else
    echo "CPLEX not found — skipping"
  fi
fi

# Parse CPLEX and AMPL outputs to CSV with node scripts
echo "=========================================="
echo "Converting CPLEX solutions to CSV"
echo "=========================================="

find "$RESULTS_CPLEX_DIR" "$RESULTS_AMPL_DIR" -type f \( -name "*.sol" -o -name "*.out" \) |
while read -r file; do
  case "$file" in
    "$RESULTS_CPLEX_DIR"/*.sol)
      rel_path="${file#$RESULTS_CPLEX_DIR/}"
      out_dir="$(dirname "$RESULTS_CSV_DIR/$rel_path")"
      out_file="$out_dir/$(basename "${file%.sol}.csv")"
      mkdir -p "$out_dir"
      node data/cplex-out-to-csv.js "$file" "$out_file"
      ;;

    "$RESULTS_AMPL_DIR"/*.out)
      rel_path="${file#$RESULTS_AMPL_DIR/}"
      out_dir="$(dirname "$RESULTS_CSV_DIR/$rel_path")"
      out_file="$out_dir/$(basename "${file%.out}.csv")"
      mkdir -p "$out_dir"
      node data/ampl-out-to-csv.js "$file" "$out_file"
      ;;
  esac
done


# Generate Gantt charts from all CSV results
echo "=========================================="
echo "Generating charts"
echo "=========================================="

if [ -f "$VENV_PATH/bin/activate" ]; then
  source "$VENV_PATH/bin/activate"
else
  echo "Virtualenv not found: $VENV_PATH" >&2
  echo "Creating virtualenv..." >&2
  python3 -m venv "$VENV_PATH"
  source "$VENV_PATH/bin/activate"
  pip3 install -r data/requirements.txt
fi

for r in \
  "$RESULTS_CSV_DIR"/*.csv \
  "$RESULTS_CPLEX_DIR"/*.csv \
  "$RESULTS_AMPL_DIR"/*.out; do

  [ -s "$r" ] || continue

  out="$CHARTS_DIR/$(basename "$r" | sed 's/\..*$/_gantt.png/')"

  echo "Plot: $(basename "$r")"
  python3 data/plot.py "$r" "$out"
done

deactivate

echo "DONE"