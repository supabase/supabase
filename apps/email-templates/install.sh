#!/usr/bin/env bash
set -euo pipefail
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-$(cd "$SOURCE_DIR/.." && pwd)/alazab-email-templates}"

if [[ "$(realpath -m "$TARGET")" == "$(realpath -m "$SOURCE_DIR")" ]]; then
  echo "Target must differ from source directory" >&2
  exit 1
fi

mkdir -p "$TARGET"
(
  cd "$SOURCE_DIR"
  tar \
    --exclude='./.git' \
    --exclude='./.env.container' \
    --exclude='./secrets/templates_api_token' \
    --exclude='./secrets/resend_api_key' \
    --exclude='./secrets/email_webhook_secret' \
    -cf - .
) | (
  cd "$TARGET"
  tar -xf -
)

printf 'Installed to %s\n' "$TARGET"
printf 'Next: cd %q && ./scripts/container-init.sh\n' "$TARGET"
