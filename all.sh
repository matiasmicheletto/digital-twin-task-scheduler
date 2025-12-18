#!/usr/bin/env bash
set -euo pipefail

#######################################
# Configuration
#######################################
TASKS_DIR="data/instances/tasks"
NETS_DIR="data/instances/networks"
DAT_DIR="data/instances/dat"

RESULTS_HEU_DIR="data/results/solver"
RESULTS_CPLEX_DIR="data/results/cplex"
RESULTS_AMPL_DIR="data/results/ampl"
CHARTS_DIR="data/charts"

VENV_PATH="data/venv"
RUNTIME_FILE="data/results/runtimes.txt"

#######################################
# Setup
#######################################
mkdir -p \
  "$RESULTS_HEU_DIR" \
  "$RESULTS_CPLEX_DIR" \
  "$RESULTS_AMPL_DIR" \
  "$CHARTS_DIR"

: > "$RUNTIME_FILE"

shopt -s nullglob

#######################################
# Generate dataset
#######################################
echo "=== Generating dataset ==="
(
  cd data
  ./make-dataset.sh
)

#######################################
# Build solver
#######################################
echo "=== Building heuristic solver ==="
make solver

#######################################
# Heuristic solver runs
#######################################
echo "=== Running heuristic solver ==="

for t in "$TASKS_DIR"/*.json; do
  for n in "$NETS_DIR"/*.json; do
    base_t=$(basename "$t" .json)
    base_n=$(basename "$n" .json)

    for strategy in random annealing; do
      out="$RESULTS_HEU_DIR/${base_t}__${base_n}_${strategy}.csv"

      echo "Heuristic [$strategy]: $base_t / $base_n"

      if ./solver/bin/solve \
          -t "$t" \
          -n "$n" \
          -s "$strategy" \
          -o csv > "$out"; then
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
echo "=== Running AMPL solver ==="

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
echo "=== Running CPLEX solver ==="

if command -v cplex >/dev/null 2>&1; then
  for dat in "$DAT_DIR"/*.dat; do
    base=$(basename "$dat" .dat)
    sol="$RESULTS_CPLEX_DIR/${base}.sol"
    csv="$RESULTS_CPLEX_DIR/${base}_cplex.csv"

    echo "CPLEX: $base"

    start=$(date +%s)

    cplex -c \
      "read $dat" \
      "optimize" \
      "write $sol sol" \
      "quit"

    end=$(date +%s)
    echo "cplex $base $((end - start))s" >> "$RUNTIME_FILE"

    ###################################
    # Convert XML solution to CSV
    ###################################
    python3 <<EOF
import xml.etree.ElementTree as ET
import csv

tree = ET.parse("$sol")
root = tree.getroot()

with open("$csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Task", "Start", "Finish", "Resource"])

    starts = {}
    finishes = {}

    for var in root.iter("variable"):
        name = var.attrib["name"]
        value = float(var.attrib["value"])

        if name.startswith("s["):
            t, r = name[2:-1].split(",")
            starts[t] = (r, value)
        elif name.startswith("f["):
            t = name[2:-1]
            finishes[t] = value

    for t, (r, s) in starts.items():
        fval = finishes.get(t, "")
        writer.writerow([t, s, fval, r])
EOF

    echo "OK  -> $csv"
  done
else
  echo "CPLEX not found — skipping"
fi

#######################################
# Plot generation
#######################################
echo "=== Generating charts ==="

if [ -f "$VENV_PATH/bin/activate" ]; then
  source "$VENV_PATH/bin/activate"
else
  echo "Virtualenv not found: $VENV_PATH" >&2
  exit 1
fi

for r in \
  "$RESULTS_HEU_DIR"/*.csv \
  "$RESULTS_CPLEX_DIR"/*.csv \
  "$RESULTS_AMPL_DIR"/*.out; do

  [ -s "$r" ] || continue

  out="$CHARTS_DIR/$(basename "$r" | sed 's/\..*$/_gantt.png/')"

  echo "Plot: $(basename "$r")"
  python3 data/plot.py "$r" "$out"
done

deactivate

echo "=== DONE ==="
