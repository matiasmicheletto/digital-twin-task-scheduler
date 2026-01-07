#!/usr/bin/env bash
set -euo pipefail

#######################################
# Configuration
#######################################
TASKS_DIR="data/instances/tasks"
NETS_DIR="data/instances/networks"
DAT_DIR="data/instances/dat"

RESULTS_CSV_DIR="data/results/csv"
RESULTS_CPLEX_DIR="data/results/cplex"
RESULTS_AMPL_DIR="data/results/ampl"
CHARTS_DIR="data/charts"

VENV_PATH="data/venv"
RUNTIME_FILE="data/results/runtimes.txt"

#######################################
# Setup
#######################################
mkdir -p \
  "$RESULTS_CSV_DIR" \
  "$RESULTS_CPLEX_DIR" \
  "$RESULTS_AMPL_DIR" \
  "$CHARTS_DIR"

: > "$RUNTIME_FILE"

shopt -s nullglob # Make globs return empty if no matches



#######################################
# Generate dataset
#######################################
#echo "=========================================="
#echo "Generating dataset"
#echo "=========================================="

# Generate a batch of tasks based on the presets
#node data/task-generator.js presets --output "$TASKS_DIR"

# Build a batch of networks based on the presets
#node data/network-generator.js --batch presets --output "$NETS_DIR"

#echo "=========================================="
#echo "Converting JSON to DAT"
#echo "=========================================="
#for t in "$TASKS_DIR"/*.json; do
#  for n in "$NETS_DIR"/*.json; do
#    base_t=$(basename "$t" .json)
#    base_n=$(basename "$n" .json)
#    t_abs=$(realpath "$t")
#    n_abs=$(realpath "$n")
#    out="$DAT_DIR/${base_t}__${base_n}.dat"

#    node data/json-to-dat.js -t "$t_abs" -n "$n_abs" -o "$out"
#  done
#done



#######################################
# Build solver
#######################################
echo "=========================================="
echo "Building heuristic solver"
echo "=========================================="
make solver


#######################################
# Convert DAT to JSON
#######################################
echo "=========================================="
echo "Converting DAT to JSON"
echo "=========================================="
./data/all-dat-to-json.sh


#######################################
# Heuristic solver runs
#######################################
echo "=========================================="
echo "Running heuristic solver"
echo "=========================================="

for t in "$TASKS_DIR"/*.json; do
  for n in "$NETS_DIR"/*.json; do
    base_t=$(basename "$t" .json)
    base_n=$(basename "$n" .json)
    t_abs=$(realpath "$t")
    n_abs=$(realpath "$n")

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
        echo "OK  -> $out"
      else
        echo "FAIL -> $base_t / $base_n ($strategy)" >&2
        rm -f "$out"
      fi
    done
  done
done




#######################################
# AMPL solver
#######################################
echo "=========================================="
echo "Running AMPL solver"
echo "=========================================="

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



#######################################
# CPLEX solver (XML solution output)
#######################################
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



#######################################
# Convert CPLEX and AMPL solutions to CSV
#######################################
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



#######################################
# Plot generation
#######################################
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
