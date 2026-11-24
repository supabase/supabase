#!/bin/bash
#
# Generic PostToolUse / CLI format-and-lint script.
# Works with:
#   - Claude Code PostToolUse hooks (stdin JSON: .tool_input.file_path / .tool_response.filePath)
#   - Antigravity PostToolUse hooks (stdin JSON: .toolCall.args.Path / .toolCall.args.TargetFile)
#   - Direct CLI invocation: .agents/scripts/format_and_lint.sh <file_path>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Apps/packages that have ESLint configured.
# Add new entries here when a new workspace gets ESLint set up.
ESLINT_PACKAGES=(
  "apps/design-system"
  "apps/docs"
  "apps/learn"
  "apps/studio"
  "apps/ui-library"
  "apps/www"
)

hook_mode=false
file_path=""
tool_error=""
project_dir="${CLAUDE_PROJECT_DIR:-$DEFAULT_PROJECT_DIR}"

if [[ $# -gt 0 ]]; then
  file_path="$1"
elif [[ ! -t 0 ]]; then
  hook_mode=true
  payload="$(cat)"

  if [[ -n "$payload" ]]; then
    if command -v jq >/dev/null 2>&1; then
      tool_error="$(printf '%s' "$payload" | jq -r '.error // empty' 2>/dev/null || true)"
      file_path="$(printf '%s' "$payload" | jq -r '
        .tool_input.file_path
        // .tool_response.filePath
        // .toolCall.args.Path
        // .toolCall.args.TargetFile
        // .toolCall.args.path
        // .toolCall.args.file_path
        // empty
      ' 2>/dev/null || true)"
    elif command -v node >/dev/null 2>&1; then
      parsed="$(printf '%s' "$payload" | node -e '
        const fs = require("fs");
        try {
          const d = JSON.parse(fs.readFileSync(0, "utf8"));
          const err = d.error || "";
          const fp =
            d.tool_input?.file_path ||
            d.tool_response?.filePath ||
            d.toolCall?.args?.Path ||
            d.toolCall?.args?.TargetFile ||
            d.toolCall?.args?.path ||
            d.toolCall?.args?.file_path ||
            "";
          process.stdout.write(err + "\n" + fp);
        } catch {}
      ' 2>/dev/null || true)"
      tool_error="$(printf '%s\n' "$parsed" | sed -n '1p')"
      file_path="$(printf '%s\n' "$parsed" | sed -n '2p')"
    fi
  fi
fi

finish() {
  if [[ "$hook_mode" == true ]]; then
    printf '{}\n'
  fi
  exit 0
}

# Skip if the tool call failed or no file path was provided.
if [[ -n "$tool_error" || -z "$file_path" || "$file_path" == "null" ]]; then
  finish
fi

# Resolve relative paths against project_dir.
if [[ "$file_path" != /* ]]; then
  file_path="$project_dir/$file_path"
fi

# Skip non-existent files or files outside the repository (e.g. scratch/artifacts).
if [[ ! -f "$file_path" || "$file_path" != "$project_dir/"* ]]; then
  finish
fi

cd "$project_dir"

run_cmd() {
  if [[ "$hook_mode" == true ]]; then
    "$@" >&2
  else
    "$@"
  fi
}

# Format supported file types with oxfmt
case "$file_path" in
  *.ts|*.tsx|*.mts|*.cts|*.js|*.jsx|*.mjs|*.cjs|*.json|*.jsonc|*.css|*.scss|*.md|*.mdx|*.html|*.yaml|*.yml)
    if [[ -x "$project_dir/node_modules/.bin/oxfmt" ]]; then
      run_cmd "$project_dir/node_modules/.bin/oxfmt" --no-error-on-unmatched-pattern "$file_path" || true
    else
      run_cmd pnpm exec oxfmt --no-error-on-unmatched-pattern "$file_path" || true
    fi
    ;;
esac

# ESLint only for JS/TS files in supported workspaces
case "$file_path" in
  *.ts|*.tsx|*.js|*.jsx)
    rel_path="${file_path#"$project_dir/"}"
    for dir in "${ESLINT_PACKAGES[@]}"; do
      if [[ "$rel_path" == "$dir/"* ]]; then
        if [[ -x "$project_dir/node_modules/.bin/eslint" ]]; then
          (cd "$project_dir/$dir" && run_cmd "$project_dir/node_modules/.bin/eslint" --fix "$file_path") || true
        else
          filter="${dir##*/}"
          run_cmd pnpm --filter="$filter" exec eslint --fix "$file_path" || true
        fi
        break
      fi
    done
    ;;
esac

finish
