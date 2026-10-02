#!/usr/bin/env bash
set -euo pipefail

# The image has nothing behind these four paths, so their named volumes mount root-owned.
sudo chown -R vscode:vscode _build deps assets/node_modules priv/plts

# Fills the empty deps volume so ElixirLS is useful straight away.
mix deps.get

cat <<'EOF'

  Ready. Next steps:

    mix setup           # Elixir and asset deps
    mise run db-start   # Postgres on 127.0.0.1:5432 (realtime) and :5433 (tenant)
    mise run dev        # http://localhost:4000/status, also from host

  Tests need the databases up too: mise run db-start && mix test

EOF
