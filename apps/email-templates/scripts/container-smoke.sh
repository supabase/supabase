#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOKEN_FILE="$ROOT/secrets/templates_api_token"
PORT="${TEMPLATES_HOST_PORT:-8080}"
BASE_URL="${TEMPLATES_BASE_URL:-http://127.0.0.1:${PORT}}"

[[ -s "$TOKEN_FILE" ]] || { echo "Missing $TOKEN_FILE" >&2; exit 1; }
TOKEN="$(<"$TOKEN_FILE")"

curl -fsS "$BASE_URL/healthz" | python3 -m json.tool
curl -fsS "$BASE_URL/readyz" | python3 -m json.tool
curl -fsS "$BASE_URL/v1/templates" \
  -H "authorization: Bearer $TOKEN" \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print({"count":d["count"]})'

curl -fsS -X POST "$BASE_URL/v1/render" \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  --data '{"templateId":"az.auth.email_confirmation.ar.v1","data":{"recipient_name":"محمد عزب","reference":"AUTH-001","action_url":"https://alazab.com"}}' \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print({"templateId":d["templateId"],"subject":d["subject"]})'
