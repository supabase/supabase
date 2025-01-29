#!/bin/bash

# Ensure intended operation
echo "WARNING: This will remove all containers and container data, and will reset the .env file. This action cannot be undone!"
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

# If VOLUME_BASE_PATH is empty, revert to default value "./volumes"
if [ -z "$VOLUME_BASE_PATH" ]; then
    VOLUME_BASE_PATH="./volumes"
fi

echo "Volumes will be reset at: $VOLUME_BASE_PATH"

# Shut down and remove all containers
echo "Stopping and removing all containers..."
docker compose -f docker-compose.yml -f ./dev/docker-compose.dev.yml down -v --remove-orphans

# Retrieve bind-mounted directories
BIND_MOUNTS=(
    "${VOLUME_BASE_PATH}/db-config"
    "${VOLUME_BASE_PATH}/db-data"
    "${VOLUME_BASE_PATH}/storage-data"
)

# Delete contents of bind-mounted directories
echo "Cleaning up bind-mounted directories..."
for DIR in "${BIND_MOUNTS[@]}"; do
    if [ -d "$DIR" ]; then
        echo "Deleting contents of $DIR..."
        rm -rf "$DIR"/*
        rm -rf "$DIR"/.[!.]*  # This also removes hidden files
    else
        echo "Directory $DIR does not exist. Skipping cleanup step..."
    fi
done

# Reset .env file
if [ -f ".env.example" ]; then
    echo "Copying .env.example to .env..."
    cp .env.example .env
else
    echo ".env.example file not found. Skipping .env reset step..."
fi

# Cleanup complete
echo "Cleanup complete!"
