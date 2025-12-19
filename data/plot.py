# !/usr/bin/env python3

# Makes a Gantt chart from a CSV schedule file.
# Usage: python plot.py <schedule.csv> [output.png]

import sys
import os
import pandas as pd
import matplotlib.pyplot as plt

def main():
    # Check arguments
    if len(sys.argv) < 2:
        print("Usage: python plot.py <schedule.csv> [output.png]")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) >= 3 else None

    # Validate file
    if not os.path.isfile(input_file):
        print(f"Error: file '{input_file}' not found.")
        sys.exit(1)

    # Load CSV
    df = pd.read_csv(input_file)

    # Collect servers and assign vertical positions
    servers = sorted(df["server"].unique())
    server_positions = {srv: i for i, srv in enumerate(servers)}

    fig, ax = plt.subplots(figsize=(14, 6))

    # Draw Gantt bars
    for _, row in df.iterrows():
        y = server_positions[row["server"]]
        ax.barh(
            y=y,
            width=row["finish"] - row["start"],
            left=row["start"],
            edgecolor="black"
        )
        ax.text(
            row["start"] + 0.1,
            y,
            row["task"],
            va="center",
            ha="left"
        )

    # Labels and formatting
    ax.set_yticks(list(server_positions.values()))
    ax.set_yticklabels(servers)
    ax.set_xlabel("Time slots")
    ax.set_ylabel("Servers")
    ax.set_title("Task Schedule Gantt Chart")

    plt.tight_layout()
    if output_file:
        plt.savefig(output_file)
        print(f"Saved Gantt chart to '{output_file}'")
    else:
        plt.show()
    

if __name__ == "__main__":
    main()
