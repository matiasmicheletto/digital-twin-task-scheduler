#!/bin/bash

# Generates the dataset: tasks, networks in json format and converts them to .dat files

TASKS_DIR="instances/tasks"
NETS_DIR="instances/networks"
DAT_DIR="instances/dat"

rm -r "$TASKS_DIR" "$NETS_DIR" "$DAT_DIR"

# Generate a batch of tasks based on the presets
node task-generator.js presets --output "$TASKS_DIR"

# Build a batch of networks based on the presets
node network-generator.js --batch presets --output "$NETS_DIR"

# Convert to .dat
mkdir -p "$DAT_DIR"

for s in "$TASKS_DIR"/*.json; do
  for n in "$NETS_DIR"/*.json; do
    base_s=$(basename "$s" .json)
    base_n=$(basename "$n" .json)
    out="$DAT_DIR/${base_s}__${base_n}.dat"

    node json-to-dat.js -s "$s" -n "$n" -o "$out"
  done
done