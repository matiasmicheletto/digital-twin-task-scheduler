#!/bin/bash

cd ..                                           # move to solver/ directory
make                                            # build the solver
./bin/hardcoded > ./test/result.csv             # run the hardcoded main to produce result.csv

result=$?
if [ $result -ne 0 ]; then
    echo "Error: Solver execution failed with code $result"
    rm ./test/result.csv                       # remove possibly incomplete result file
    exit $result
fi

if [ -z "$VIRTUAL_ENV" ]; then                  # check if python virtuenv is activated
    source ../data/venv/bin/activate            # activate python virtuenv
fi
python3 ../data/plot.py ./test/result.csv       # plot the result
deactivate                                      # deactivate python virtuenv
rm ./test/result.csv                           # remove result file