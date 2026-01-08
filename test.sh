#!/bin/bash

rm ./solver/bin/solver_log.csv
rm ./data/results/csv/*
rm ./data/charts/*

# Run solver
./solver/bin/solve -t data/instances/tasks/sched10.json -n data/instances/networks/net10.json -o csv -s random > data/results/csv/random_10.csv
./solver/bin/solve -t data/instances/tasks/sched10.json -n data/instances/networks/net10.json -o csv -s annealing > data/results/csv/annealing_10.csv
./solver/bin/solve -t data/instances/tasks/sched10.json -n data/instances/networks/net10.json -o csv -s genetic > data/results/csv/genetic_10.csv

./solver/bin/solve -t data/instances/tasks/sched20.json -n data/instances/networks/net20.json -o csv -s random > data/results/csv/random_20.csv
./solver/bin/solve -t data/instances/tasks/sched20.json -n data/instances/networks/net20.json -o csv -s annealing > data/results/csv/annealing_20.csv
./solver/bin/solve -t data/instances/tasks/sched20.json -n data/instances/networks/net20.json -o csv -s genetic > data/results/csv/genetic_20.csv

./solver/bin/solve -t data/instances/tasks/sched30.json -n data/instances/networks/net30.json -o csv -s random > data/results/csv/random_30.csv
./solver/bin/solve -t data/instances/tasks/sched30.json -n data/instances/networks/net30.json -o csv -s annealing > data/results/csv/annealing_30.csv
./solver/bin/solve -t data/instances/tasks/sched30.json -n data/instances/networks/net30.json -o csv -s genetic > data/results/csv/genetic_30.csv

# Generate charts
cd data
source venv/bin/activate
cd ..
python3 data/plot.py data/results/csv/random_10.csv data/charts/random_10.png
python3 data/plot.py data/results/csv/annealing_10.csv data/charts/annealing_10.png
python3 data/plot.py data/results/csv/genetic_10.csv data/charts/genetic_10.png

python3 data/plot.py data/results/csv/random_20.csv data/charts/random_20.png
python3 data/plot.py data/results/csv/annealing_20.csv data/charts/annealing_20.png
python3 data/plot.py data/results/csv/genetic_20.csv data/charts/genetic_20.png

python3 data/plot.py data/results/csv/random_30.csv data/charts/random_30.png
python3 data/plot.py data/results/csv/annealing_30.csv data/charts/annealing_30.png
python3 data/plot.py data/results/csv/genetic_30.csv data/charts/genetic_30.png

deactivate