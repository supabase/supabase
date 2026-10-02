#!/usr/bin/env bash

count=0

while true; do
    ((count++))
    
    echo "Running cargo test (Attempt $count)..."
    cargo test -q $@

    if [ $? -ne 0 ]; then
        echo "Tests failed after $count attempts! Exiting..."
        break
    fi

    echo "Tests passed. Running again..."
done
