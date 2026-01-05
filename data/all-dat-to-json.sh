#!/bin/bash

# Input and output directories
DAT_DIR="instances/dat"
NET_DIR="instances/networks"
TASK_DIR="instances/tasks"

# Ensure output directories exist (optional, but recommended)
mkdir -p "$NET_DIR"
mkdir -p "$TASK_DIR"

# Loop through all .dat files in the dat directory
for dat_file in "$DAT_DIR"/*.dat; do
    
    # Extract the filename without the path and extension (e.g., "40")
    filename=$(basename "$dat_file" .dat)
    
    echo "Processing $filename..."

    # Define the output paths based on the filename
    net_output="$NET_DIR/net${filename}.json"
    task_output="$TASK_DIR/sched${filename}.json"

    # Execute the node command
    node dat-to-json.js -d "$dat_file" -n "$net_output" -t "$task_output"
done

echo "Conversion complete!"