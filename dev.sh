#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting Docker services..."
cd "$REPO_ROOT/docker"
docker compose up -d

echo "Starting Studio dev server..."
cd "$REPO_ROOT"

# Load nvm and switch to Node 22
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
nvm use 22

pnpm dev:studio
