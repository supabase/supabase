#!/usr/bin/env bash
set -e

SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")

export $(grep -v '^#' $SCRIPTPATH/../.env | xargs)

# --features cli/tracing
cargo build --features cli/tracing && \
RUST_BACKTRACE=full ./target/debug/edge-runtime "$@" start \
    --main-service ./examples/main \
    --event-worker ./examples/event-manager
