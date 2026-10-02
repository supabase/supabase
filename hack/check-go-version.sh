#!/usr/bin/env bash

# Ensures the pinned Go patch version is identical everywhere it appears.
# Source of truth is the `go` directive in the root go.mod.
set -euo pipefail

cd "$(dirname "$0")/.."

# "X.Y.Z" from a go.mod `go` directive.
gomod_version() { grep -m1 -E '^go [0-9]' "$1" | awk '{print $2}'; }
# "X.Y.Z" from a Dockerfile `FROM golang:X.Y.Z-...` line.
dockerfile_version() { grep -m1 -oE 'golang:[0-9]+\.[0-9]+\.[0-9]+' "$1" | cut -d: -f2; }

WANT="$(gomod_version go.mod)"
FAIL=false

check() { # <label> <found>
  if [ "$2" != "$WANT" ]; then
    echo "✗ $1 pins Go $2, expected $WANT (from go.mod)"
    FAIL=true
  fi
}

check "tools/go.mod"                   "$(gomod_version tools/go.mod)"
check "internal/forks/godotenv/go.mod" "$(gomod_version internal/forks/godotenv/go.mod)"
check "Dockerfile"                     "$(dockerfile_version Dockerfile)"
check "Dockerfile.dev"                 "$(dockerfile_version Dockerfile.dev)"

if [ "$FAIL" = true ]; then
  echo
  echo "Go version mismatch. Update every pinned spot above to match go.mod ($WANT)."
  exit 1
fi

echo "Go version $WANT is consistent across all pinned files."
