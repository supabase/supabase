#!/bin/bash
#
# PostToolUse hook: format and lint apps/studio/ files after Write or Edit.
# Receives hook JSON on stdin from Claude Code.

set -euo pipefail

# Extract the file path from stdin JSON.
# Falls back to .tool_response.filePath for Write tool compat.
file_path=$(jq -r '.tool_input.file_path // .tool_response.filePath' 2>/dev/null)

if [[ -z "$file_path" || "$file_path" == "null" ]]; then
  exit 0
fi

# Only run for files under apps/studio/
case "$file_path" in
  *apps/studio/*)
    cd "$CLAUDE_PROJECT_DIR"
    pnpm exec prettier --config prettier.config.mjs --write "$file_path"

    # ESLint only for JS/TS files
    case "$file_path" in
      *.ts|*.tsx|*.js|*.jsx)
        pnpm --filter=studio exec eslint --fix "$file_path"
        ;;
    esac
    ;;
esac
