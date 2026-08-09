#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SECRETS="$ROOT/secrets"
TOKEN_FILE="$SECRETS/templates_api_token"
ENV_FILE="$ROOT/.env.container"

install -d "$SECRETS"
chmod 700 "$SECRETS"
umask 077

if [[ ! -s "$TOKEN_FILE" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32 > "$TOKEN_FILE"
  else
    python3 - <<'PY' > "$TOKEN_FILE"
import secrets
print(secrets.token_hex(32))
PY
  fi
fi
chmod 444 "$TOKEN_FILE"

for optional_secret in resend_api_key email_webhook_secret; do
  optional_path="$SECRETS/$optional_secret"
  if [[ ! -e "$optional_path" ]]; then
    : > "$optional_path"
  fi
  chmod 444 "$optional_path"
done

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ROOT/.env.container.example" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

printf 'Prepared:\n  %s\n  %s\n' "$TOKEN_FILE" "$ENV_FILE"
printf 'Next: docker compose --env-file %s up -d --build\n' "$ENV_FILE"
