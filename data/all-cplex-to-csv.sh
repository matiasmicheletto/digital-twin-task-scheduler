#!/usr/bin/env bash

INPUT_DIR="results/cplex"
OUTPUT_DIR="results/csv"

find "$INPUT_DIR" -type f -name "*.sol" | while read -r file; do
    rel_path="${file#$INPUT_DIR/}"
    out_dir="$(dirname "$OUTPUT_DIR/$rel_path")"
    out_file="$out_dir/$(basename "${file%.sol}.csv")"

    mkdir -p "$out_dir"
    node cplex-out-to-csv.js "$file" "$out_file"
done