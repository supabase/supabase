#!/usr/bin/env bash
set -euo pipefail

FLAKE="flake.nix"
FAKE_HASH="sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="

hash_count=$(grep -c 'outputHash = "sha256-' "$FLAKE")
[[ "$hash_count" -eq 1 ]] || { echo "Expected exactly one outputHash line, found $hash_count"; exit 1; }

trap 'git checkout -- "$FLAKE" 2>/dev/null || true' ERR

update_flake_hash() {
  local pattern="$1" replacement="$2"
  sed -i.bak "s|outputHash = \"${pattern}\";|outputHash = \"${replacement}\";|" "$FLAKE"
  rm -f "${FLAKE}.bak"
}

update_flake_hash "sha256-.*" "$FAKE_HASH"

echo "Probing for correct node_modules hash..."
NIX_OUT=$(nix build 2>&1 || true)

REAL_HASH=$(echo "$NIX_OUT" | grep -Eo 'got:[[:space:]]+(sha256|sha512|sha1)-[A-Za-z0-9+/=]{20,}' | awk '{print $2}' | head -n1)

if [[ -z "$REAL_HASH" ]]; then
  if echo "$NIX_OUT" | grep -q "error:"; then
    echo "Build failed:"
    echo "$NIX_OUT"
    exit 1
  fi
  echo "Hash was already correct. Build succeeded."
  echo "Done. Binary available at ./result/bin/realtime-check"
  exit 0
fi

echo "Updating hash to: $REAL_HASH"
update_flake_hash "$FAKE_HASH" "$REAL_HASH"

echo "Building with correct hash..."
trap - ERR
nix build
echo "Done. Binary available at ./result/bin/realtime-check"
