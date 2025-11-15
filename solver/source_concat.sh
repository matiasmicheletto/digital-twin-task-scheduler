#!/bin/bash

OUTPUT="all.cpp"

# List your files in dependency order
HEADERS=(
    "include/utils.h"
    "include/task.h"
    "include/server.h"
    "include/scheduler.h"
    "include/solver.h"
)

SOURCES=(
    "src/scheduler/import.cpp"
    "src/scheduler/print.cpp"
    "src/scheduler/main.cpp"
    "src/utils.cpp"
    "src/task.cpp"
    "src/server.cpp"
    "src/solver.cpp"
    "src/solve_main.cpp"
)

> "$OUTPUT"  # Clear output file

echo "// ====== HEADERS ======" >> "$OUTPUT"
for header in "${HEADERS[@]}"; do
    echo "// ====== $header ======" >> "$OUTPUT"
    cat "$header" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
done

echo "// ====== IMPLEMENTATIONS ======" >> "$OUTPUT"
for source in "${SOURCES[@]}"; do
    echo "// ====== $source ======" >> "$OUTPUT"
    # Remove #include lines to avoid duplication
    grep -v '^#include[[:space:]]*"' "$source" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
done

echo "Combined files into $OUTPUT"