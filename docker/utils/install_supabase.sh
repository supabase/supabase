#!/bin/sh

set -e

echo "===> Checking if Docker is running..."
sudo systemctl status docker 2>&1 | grep -i 'active.*running' || {
    echo "Docker is not running."
    echo "Exiting."
    exit 1
}

echo "===> Getting the Supabase repo clone..."
git clone --depth 1 https://github.com/supabase/supabase

echo "===> Making a new supabase project directory..."
mkdir supabase-project

echo "===> Coping the compose files over to the new project..."
cp -rf supabase/docker/* supabase-project

echo "===> Copying the default env vars..."
cp supabase/docker/.env.example supabase-project/.env

echo "===> Changing to the project directory..."
cd supabase-project

echo "===> Pulling the latest images..."
docker compose pull

echo ""
echo "*** Make sure to edit .env and replace passwords, keys, and hostnames with your own values!!! ***"
echo ""
