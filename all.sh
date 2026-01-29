#!/usr/bin/env bash

##
# Script to process all instances: convert, solve with multiple methods, and plot.
# Usage: ./all.sh
##

set -euo pipefail # Strict mode
shopt -s nullglob

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




echo "Setting up directories..."

mkdir -p \
  "$RESULTS_CSV_DIR" \
  "$RESULTS_CPLEX_DIR" \
  "$RESULTS_AMPL_DIR" \
  "$CHARTS_DIR" \
  "$TASKS_DIR" \
  "$NETS_DIR"
rm -rf "$TASKS_DIR"/* "$NETS_DIR"/* "$RESULTS_CSV_DIR"/* "$RESULTS_CPLEX_DIR"/* "$RESULTS_AMPL_DIR"/* "$CHARTS_DIR"/*

# Clear solver log if exists
if [ -f "./solver/bin/solver_log.csv" ]; then
  rm ./solver/bin/solver_log.csv
fi

echo "Done."
echo ""



echo "Converting DAT to JSON..."
for dat_file in "$DAT_DIR"/*.dat; do # For each instance DAT file
    
    # Extract the instance_name without the path and extension (e.g., "40")
    instance_name=$(basename "$dat_file" .dat)
    
    echo "Processing $instance_name..."

    # Define the output paths based on the instance_name
    dat_abs=$(realpath "$dat_file")
    net_output=$(realpath "$NETS_DIR")/net${instance_name}.json
    task_output=$(realpath "$TASKS_DIR")/sched${instance_name}.json

    # Execute the node command to convert DAT to JSON
    node data/dat-to-json.js -d "$dat_abs" -n "$net_output" -t "$task_output"

    # Check if json files were created
    if [ ! -f "$net_output" ] || [ ! -f "$task_output" ]; then
      echo "Error: JSON files not created for $instance_name!"
      exit 1
    fi
done
echo "All DAT files converted to JSON."
echo ""



echo "Compiling solver..."
make solver


echo "Running solvers on all instances..."
for dat_file in "$DAT_DIR"/*.dat; do

  # Get base names and paths
  instance_name=$(basename "$dat_file" .dat)
  task_json="$TASKS_DIR/sched${instance_name}.json"
  net_json="$NETS_DIR/net${instance_name}.json"
  t_abs=$(realpath "$task_json")
  n_abs=$(realpath "$net_json")

  for strategy in random annealing genetic; do

    echo "Using strategy: $strategy, for instance: $instance_name"

    # Prepare output file path
    base_t=$(basename "$task_json" .json)
    base_n=$(basename "$net_json" .json)
    out="$RESULTS_CSV_DIR/${base_t}__${base_n}_${strategy}.csv"

    
    if (
      cd solver && \
      # Run the solver
      ./bin/solve \
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

    echo "Solver finished for $instance_name"
    echo ""

  done
done

echo "All solvers finished."
echo ""



# Run AMPL solver for each instance if enabled
if [[ "${RUN_AMPL:-false}" == true ]]; then
  
  echo "Running AMPL solver"

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
        echo "OK  -> $out"
      else
        echo "FAIL -> AMPL $base" >&2
        rm -f "$out"
      fi
    done
  else
    echo "AMPL not found — skipping"
  fi

  echo "AMPL solving done."
  echo ""
fi

# Run CPLEX solver for each instance if enabled
if [[ "${RUN_CPLEX:-false}" == true ]]; then
  
  echo "Running CPLEX solver"
  
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
        echo "OK  -> $sol"
      else
        echo "FAIL -> CPLEX $base" >&2
        rm -f "$sol"
      fi
    done
  else
    echo "CPLEX not found — skipping"
  fi

  echo "CPLEX solving done."
  echo ""
fi


# Parse CPLEX and AMPL outputs to CSV with node scripts

echo "Converting CPLEX solutions to CSV.."

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
echo "Conversion done."
echo ""


# Generate Gantt charts from all CSV results

echo "Generating charts..."

# Set up and activate virtualenv
if [ -f "$VENV_PATH/bin/activate" ]; then
  source "$VENV_PATH/bin/activate"
else
  echo "Virtualenv not found: $VENV_PATH" >&2
  echo "Creating virtualenv..." >&2
  python3 -m venv "$VENV_PATH"
  source "$VENV_PATH/bin/activate"
  pip3 install -r data/requirements.txt
fi

# Loop through all CSV results and generate charts
for r in \
  "$RESULTS_CSV_DIR"/*.csv; do

  [ -s "$r" ] || continue

  out="$CHARTS_DIR/$(basename "$r" | sed 's/\..*$/_gantt.png/')"

  echo "Plot: $(basename "$r")"
  python3 data/plot.py "$r" "$out"
done

# Deactivate virtualenv
deactivate
echo "All charts generated."


echo "=========================================="
echo "JOB COMPLETED."
echo "=========================================="