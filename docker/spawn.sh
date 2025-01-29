#!/bin/bash

# Ensure intended operation
echo "WARNING: This will create the volume directories if they do not exist. This action cannot be undone!"
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo    # Move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Operation cancelled."
    exit 1
fi

# Initialize VOLUME_BASE_PATH as empty
VOLUME_BASE_PATH=""

# Try to find .env and extract VOLUME_BASE_PATH if it exists
if [ -f ".env" ]; then
    TEMP_PATH=$(grep -v '^#' .env | grep "^VOLUME_BASE_PATH=" | sed 's/^VOLUME_BASE_PATH=//')
    if [ ! -z "$TEMP_PATH" ]; then
        VOLUME_BASE_PATH=$(echo $TEMP_PATH | sed 's/^"\(.*\)"$/\1/')
    fi
fi

# If VOLUME_BASE_PATH is empty, set it to "./volumes/"
if [ -z "$VOLUME_BASE_PATH" ]; then
    VOLUME_BASE_PATH="./volumes"
fi

echo "Volumes will be created at: $VOLUME_BASE_PATH"

# Define directories to create
DIRECTORIES=(
    "${VOLUME_BASE_PATH}/db-config"
    "${VOLUME_BASE_PATH}/db-data"
    "${VOLUME_BASE_PATH}/storage-data"
)

# Create each directory with parent directories as needed
echo "Creating directories..."
for DIR in "${DIRECTORIES[@]}"; do
    if [ ! -d "$DIR" ]; then
        echo "Creating directory: $DIR"
        mkdir -p "$DIR"
    else
        echo "Directory already exists: $DIR"
    fi
done

# Creation complete
echo "Directory creation complete!"
