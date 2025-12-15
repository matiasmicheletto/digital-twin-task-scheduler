#!/bin/bash

tasks_dir="instances/tasks"
nets_dir="instances/networks"
out_dir="instances/dat"

rm -r "$tasks_dir" "$nets_dir" "$out_dir"

# Generate a batch of tasks based on the presets
node task-generator.js presets --output-dir "$tasks_dir"

# Build a batch of networks based on the presets
node network-generator.js --batch presets --output "$nets_dir"

# Convert to .dat
mkdir -p "$out_dir"

for s in "$tasks_dir"/*.json; do
  for n in "$nets_dir"/*.json; do
    base_s=$(basename "$s" .json)
    base_n=$(basename "$n" .json)
    out="$out_dir/${base_s}__${base_n}.dat"

    node json-to-dat.js -s "$s" -n "$n" -o "$out"
  done
done