#!/bin/sh
set -e

# Realtime runs on the Erlang VM and uses a "cookie" as the shared secret that
# cluster nodes present to trust one another. On a single-node deployment it is
# never shared with anyone, so when RELEASE_COOKIE is unset we generate a random
# one for this node on start. Set RELEASE_COOKIE explicitly (the same value on
# every node) only when running multiple Realtime nodes that must cluster.
if [ -z "${RELEASE_COOKIE:-}" ]; then
  RELEASE_COOKIE="$(openssl rand -hex 28)"
  export RELEASE_COOKIE
  echo "RELEASE_COOKIE not set; generated an ephemeral Erlang cookie for this node."
fi

# Chain to the image's original entrypoint and command.
exec /usr/bin/tini -s -g -- /app/run.sh "$@"
