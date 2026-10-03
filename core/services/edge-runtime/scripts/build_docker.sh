#!/usr/bin/env bash
set -e

SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")

export $(grep -v '^#' "$SCRIPTPATH/../.env" | xargs)

docker build \
  --build-arg "GIT_V_TAG=$GIT_V_TAG" \
  --build-arg "ONNXRUNTIME_VERSION=$ONNXRUNTIME_VERSION" \
  "$@" \
  "$SCRIPTPATH/.."
