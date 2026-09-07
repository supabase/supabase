#!/bin/bash
# Regenerate Envoy config from registry and signal Envoy to reload.
#
# Usage:
#   ./scripts/apply-envoy-config.sh [--restart-lds]
#
# Options:
#   --restart-lds   Also restart the Envoy container to pick up LDS (listener) changes.
#                   CDS (cluster) changes are picked up automatically via inotify.
#
# Prerequisites:
#   - Python 3 with PyYAML: pip3 install pyyaml
#   - docker compose available in PATH
#   - Working directory must be the project root (where docker/docker-compose.yml lives)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

RESTART_LDS=false
for arg in "$@"; do
  case "$arg" in
    --restart-lds) RESTART_LDS=true ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

echo "==> Generating Envoy cluster config (CDS)..."
python3 scripts/generate-envoy-config.py --cds > docker/volumes/api/envoy/cds.yaml
echo "    Written: docker/volumes/api/envoy/cds.yaml"

echo ""
echo "==> CDS config details:"
echo "    Envoy uses file-based xDS with inotify watching (/etc/envoy directory)."
echo "    Cluster changes in cds.yaml are reloaded automatically — no restart needed."

if [ "$RESTART_LDS" = "true" ]; then
  echo ""
  echo "==> Generating Envoy listener route snippet (LDS)..."
  python3 scripts/generate-envoy-config.py --lds > docker/volumes/api/envoy/lds.generated.yaml
  echo "    Written: docker/volumes/api/envoy/lds.generated.yaml"
  echo ""
  echo "==> IMPORTANT: Manually merge lds.generated.yaml into lds.template.yaml,"
  echo "    then copy the result to docker/volumes/api/envoy/lds.yaml before restart."
  echo ""
  echo "==> Restarting Envoy container to apply LDS changes..."
  docker compose -f docker/docker-compose.yml restart envoy
  echo "    Envoy restarted."
fi

echo ""
echo "==> Done. Config applied."
echo ""
echo "    To verify routing, test with:"
echo "    curl -H 'X-Project-Ref: project-alpha' http://localhost:8000/auth/v1/health"
echo "    curl -H 'X-Project-Ref: project-beta'  http://localhost:8000/rest/v1/"