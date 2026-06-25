#!/bin/bash
#
# PostToolUse hook: format and lint files in apps/ or packages/ after Write or Edit.
# Receives hook JSON on stdin from Claude Code.

set -euo pipefail

# Apps/packages that have ESLint configured.
# Add new entries here when a new workspace gets ESLint set up.
ESLINT_PACKAGES=(
  "apps/design-system:design-system"
  "apps/docs:docs"
  "apps/learn:learn"
  "apps/studio:studio"
  "apps/ui-library:ui-library"
  "apps/www:www"
)

# Extract the file path from stdin JSON.
# Falls back to .tool_response.filePath for Write tool compat.
file_path=$(jq -r '.tool_input.file_path // .tool_response.filePath' 2>/dev/null)

if [[ -z "$file_path" || "$file_path" == "null" ]]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Prettier and ESLint for supported file types
case "$file_path" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.scss|*.md|*.mdx|*.html|*.yaml|*.yml|*.sql)
    # SORT_IMPORTS=false matches CI's `test:prettier`, so local formatting
    # never drifts from what CI checks.
    SORT_IMPORTS=false pnpm exec prettier --config prettier.config.mjs --write "$file_path"
    ;;
esac

# ESLint only for JS/TS files in supported workspaces
case "$file_path" in
  *.ts|*.tsx|*.js|*.jsx)
    for entry in "${ESLINT_PACKAGES[@]}"; do
      dir="${entry%%:*}"
      filter="${entry##*:}"
      if [[ "$file_path" == *"$dir/"* ]]; then
        # Best-effort: a worktree with an incomplete install can fail to load
        # eslint plugins. Never let that abort the (already-done) prettier step.
        pnpm --filter="$filter" exec eslint --fix "$file_path" || true
        break
      fi
    done
    ;;
esac
