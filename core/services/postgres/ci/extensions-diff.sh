#!/usr/bin/env bash
set -euo pipefail

# Validate PR URL argument
if [ $# -ne 1 ]; then
	echo "Usage: $0 <github-pr-url>"
	echo "Example: $0 https://github.com/supabase/postgres/pull/2002"
	exit 1
fi

PR_URL="$1"

# Extract PR number from URL
# Support formats:
# - https://github.com/supabase/postgres/pull/2002
# - github.com/supabase/postgres/pull/2002
PR_NUMBER=$(echo "$PR_URL" | grep -oE '[0-9]+$')

if [ -z "$PR_NUMBER" ]; then
	echo "Error: Invalid PR URL format. Expected: https://github.com/supabase/postgres/pull/NUMBER"
	exit 1
fi

# Verify required tools are installed
if ! command -v gh &>/dev/null; then
	echo "Error: GitHub CLI (gh) is not installed"
	echo "Install from: https://cli.github.com/"
	exit 1
fi

if ! command -v git &>/dev/null; then
	echo "Error: git is not installed"
	exit 1
fi

if ! command -v jq &>/dev/null; then
	echo "Error: jq is not installed"
	exit 1
fi

# Fetch PR information using gh API
echo "Fetching PR #$PR_NUMBER information..."

if ! PR_JSON=$(gh pr view "$PR_NUMBER" --repo supabase/postgres --json headRefName,headRefOid,baseRefName 2>/dev/null) || [ -z "$PR_JSON" ]; then
	echo "Error: Failed to fetch PR #$PR_NUMBER from supabase/postgres"
	exit 1
fi

PR_BRANCH=$(echo "$PR_JSON" | jq -r '.headRefName')
PR_COMMIT=$(echo "$PR_JSON" | jq -r '.headRefOid')
BASE_BRANCH=$(echo "$PR_JSON" | jq -r '.baseRefName')

echo "PR Branch: $PR_BRANCH"
echo "PR HEAD: $PR_COMMIT"
echo "Base Branch: $BASE_BRANCH"

# Handle non-develop base branch
if [ "$BASE_BRANCH" != "develop" ]; then
	echo "Warning: PR base is '$BASE_BRANCH' instead of 'develop'"
	echo "Continuing with base branch: $BASE_BRANCH"
	echo ""
fi

# Get the current HEAD commit of the base branch
echo "Fetching $BASE_BRANCH HEAD commit..."

BASE_COMMIT=$(gh api "/repos/supabase/postgres/git/refs/heads/$BASE_BRANCH" --jq '.object.sha')

if [ -z "$BASE_COMMIT" ]; then
	echo "Error: Failed to fetch HEAD commit for branch '$BASE_BRANCH'"
	exit 1
fi

echo "$BASE_BRANCH HEAD: $BASE_COMMIT"
echo ""

# Create tmpdir for both clones
TMPDIR_BASE="${TMPDIR:-/tmp}/extension-diff-$$"
OLD_DIR="$TMPDIR_BASE/base-$BASE_BRANCH"
NEW_DIR="$TMPDIR_BASE/pr-$PR_NUMBER"

echo "Using directories:"
echo "  OLD_DIR: $OLD_DIR"
echo "  NEW_DIR: $NEW_DIR"
echo ""

# Setup output file (use absolute path since we'll be changing directories)
ORIGINAL_DIR="$(pwd)"
OUTPUT_FILE="$ORIGINAL_DIR/extensions-diff-pr-${PR_NUMBER}.md"
echo "Output will be written to: $OUTPUT_FILE"
echo ""

# Initialize output file with header
cat >"$OUTPUT_FILE" <<EOF
<!-- extension-diff-analysis -->
# PostgreSQL Extension Dependency Analysis: PR #${PR_NUMBER}

- **PR:** ${PR_URL}
- **Base Branch:** ${BASE_BRANCH} (${BASE_COMMIT:0:7})
- **PR Branch:** ${PR_BRANCH} (${PR_COMMIT:0:7})
- **Analysis Date:** $(date '+%Y-%m-%d %H:%M:%S')

EOF

# Create temporary file for collecting MAJOR updates
MAJOR_UPDATES_FILE="/tmp/major-updates-$$.txt"
: >"$MAJOR_UPDATES_FILE" # Initialize empty file

# Trap to cleanup on exit
cleanup() {
	rm -f "$MAJOR_UPDATES_FILE"
	rm -f /tmp/old-*-deps-$$.txt /tmp/new-*-deps-$$.txt
	rm -rf "$TMPDIR_BASE"
}

trap cleanup EXIT

# Function to ensure repository is at a specific commit
ensure_repo_at_commit() {
	local target_dir="$1"
	local branch_name="$2"
	local commit_sha="$3"
	local repo_url="https://github.com/supabase/postgres.git"

	if [ -d "$target_dir/.git" ]; then
		echo "Repository exists at $target_dir, updating..."
		cd "$target_dir"

		# Fetch the specific commit (shallow)
		# First try to fetch just the commit
		if ! git fetch --depth=1 origin "$commit_sha" 2>/dev/null; then
			# If that fails, fetch the branch
			git fetch --depth=1 origin "$branch_name"
		fi

		# Checkout the target commit
		git checkout "$commit_sha" 2>/dev/null || git checkout "origin/$branch_name"

	else
		echo "Cloning repository to $target_dir..."
		mkdir -p "$(dirname "$target_dir")"

		# Shallow clone with depth=1 for the specific branch
		git clone --depth=1 --branch "$branch_name" "$repo_url" "$target_dir"

		cd "$target_dir"

		# If we need a specific commit that's not HEAD, fetch it
		current_sha=$(git rev-parse HEAD)
		if [ "$current_sha" != "$commit_sha" ]; then
			git fetch --depth=1 origin "$commit_sha"
			git checkout "$commit_sha"
		fi
	fi
}

# Setup base branch checkout (OLD_DIR)
ensure_repo_at_commit "$OLD_DIR" "$BASE_BRANCH" "$BASE_COMMIT"

# Setup PR branch checkout (NEW_DIR)
ensure_repo_at_commit "$NEW_DIR" "$PR_BRANCH" "$PR_COMMIT"

# Build all variants in both directories
echo "Building in $OLD_DIR..."
cd "$OLD_DIR"
nix build ".#psql_15/bin" -o result-psql_15
nix build ".#psql_17/bin" -o result-psql_17
nix build ".#psql_orioledb-17/bin" -o result-psql_orioledb-17

echo ""
echo "Building in $NEW_DIR..."
cd "$NEW_DIR"
nix build ".#psql_15/bin" -o result-psql_15
nix build ".#psql_17/bin" -o result-psql_17
nix build ".#psql_orioledb-17/bin" -o result-psql_orioledb-17

# Function to extract package name and version from store path
parse_store_path() {
	local path="$1"
	basename "$path" | sed 's/^[a-z0-9]*-//' | sed 's/-\([0-9]\)/ \1/' | head -c 80
}

# Function to compare versions and return change type
compare_versions() {
	local old="$1"
	local new="$2"

	# Check if either version looks like a git commit hash (7+ consecutive hex chars)
	if echo "$old" | grep -qE '\b[0-9a-f]{7,}\b'; then
		echo "CHANGED"
		return
	fi
	if echo "$new" | grep -qE '\b[0-9a-f]{7,}\b'; then
		echo "CHANGED"
		return
	fi

	# Extract version numbers
	old_ver=$(echo "$old" | grep -oE '[0-9]+(\.[0-9]+)*' | head -1)
	new_ver=$(echo "$new" | grep -oE '[0-9]+(\.[0-9]+)*' | head -1)

	if [ -z "$old_ver" ] || [ -z "$new_ver" ]; then
		echo "CHANGED"
		return
	fi

	# If version is just a single number (no dots), treat as CHANGED
	if ! echo "$old_ver" | grep -q '\.'; then
		echo "CHANGED"
		return
	fi
	if ! echo "$new_ver" | grep -q '\.'; then
		echo "CHANGED"
		return
	fi

	# Split into major.minor.patch
	IFS='.' read -ra old_parts <<<"$old_ver"
	IFS='.' read -ra new_parts <<<"$new_ver"

	old_major=${old_parts[0]:-0}
	old_minor=${old_parts[1]:-0}
	old_patch=${old_parts[2]:-0}

	new_major=${new_parts[0]:-0}
	new_minor=${new_parts[1]:-0}
	new_patch=${new_parts[2]:-0}

	# Compare versions
	if [ "$new_major" -gt "$old_major" ]; then
		echo "MAJOR"
	elif [ "$new_major" -lt "$old_major" ]; then
		echo "DOWNGRADE"
	elif [ "$new_minor" -gt "$old_minor" ]; then
		echo "MINOR"
	elif [ "$new_minor" -lt "$old_minor" ]; then
		echo "DOWNGRADE"
	elif [ "$new_patch" -gt "$old_patch" ]; then
		echo "PATCH"
	elif [ "$new_patch" -lt "$old_patch" ]; then
		echo "DOWNGRADE"
	else
		echo "CHANGED"
	fi
}

# Function to get all extensions for a PostgreSQL version
get_extension_list() {
	local pg_version="$1"

	# Get extension names from versions.json that support this PG version
	jq -r --arg pgver "$pg_version" '
        to_entries[] |
        .key as $ext_name |
        .value |
        to_entries[] |
        select(.value.postgresql | map(tostring) | contains([$pgver])) |
        $ext_name
    ' "$OLD_DIR/nix/ext/versions.json" | sort -u
}

# Function to analyze extension dependencies for a PostgreSQL variant
analyze_variant_extension_deps() {
	local pg_version="$1"
	local variant_name="$2"
	local result_suffix="$3"

	echo "## $variant_name Extension Dependencies"
	echo ""

	# Check if both result symlinks exist
	if [ ! -e "$OLD_DIR/result-$result_suffix" ] || [ ! -e "$NEW_DIR/result-$result_suffix" ]; then
		echo "Skipping $variant_name (not built in one or both directories)"
		echo ""
		return
	fi

	# Get list of extensions
	extensions=$(get_extension_list "$pg_version")

	if [ -z "$extensions" ]; then
		echo "No extensions found for PostgreSQL $pg_version"
		echo ""
		return
	fi

	# Export pg_version for use in subshell
	export CURRENT_PG_VERSION="$pg_version"

	# For each extension, compare its dependencies
	echo "$extensions" | while read -r ext; do
		# Get extension shared library files in both builds (.so on Linux, .dylib on macOS)
		old_so=$(find "$OLD_DIR/result-$result_suffix/lib" \( -name "${ext}*.so" -o -name "${ext}*.dylib" \) 2>/dev/null | head -1 || echo "")
		new_so=$(find "$NEW_DIR/result-$result_suffix/lib" \( -name "${ext}*.so" -o -name "${ext}*.dylib" \) 2>/dev/null | head -1 || echo "")

		if [ -z "$old_so" ] || [ -z "$new_so" ]; then
			continue
		fi

		# Get dependency closure for the extension .so file
		old_deps=$(nix-store -qR "$old_so" 2>/dev/null | sort || echo "")
		new_deps=$(nix-store -qR "$new_so" 2>/dev/null | sort || echo "")

		# Parse and compare
		echo "$old_deps" | while read -r path; do
			parse_store_path "$path"
		done | sort >"/tmp/old-$ext-deps-$$.txt"

		echo "$new_deps" | while read -r path; do
			parse_store_path "$path"
		done | sort >"/tmp/new-$ext-deps-$$.txt"

		# Check if there are any changes
		if ! diff -q "/tmp/old-$ext-deps-$$.txt" "/tmp/new-$ext-deps-$$.txt" >/dev/null 2>&1; then
			echo "### Extension: $ext"
			echo ""
			echo "| Dependency | Old Version | New Version | Change Type |"
			echo "|------------|-------------|-------------|-------------|"

			# Get all unique package names
			cat "/tmp/old-$ext-deps-$$.txt" "/tmp/new-$ext-deps-$$.txt" | cut -d' ' -f1 | sort -u | while read -r pkg; do
				old_match=$(grep "^$pkg " "/tmp/old-$ext-deps-$$.txt" | head -1 || echo "")
				new_match=$(grep "^$pkg " "/tmp/new-$ext-deps-$$.txt" | head -1 || echo "")

				if [ -n "$old_match" ] && [ -n "$new_match" ]; then
					if [ "$old_match" != "$new_match" ]; then
						old_ver="${old_match#"$pkg "}"
						new_ver="${new_match#"$pkg "}"
						change_type=$(compare_versions "$old_match" "$new_match")
						echo "| $pkg | $old_ver | $new_ver | $change_type |"

						# Collect MAJOR updates for summary
						if [ "$change_type" = "MAJOR" ]; then
							echo "$CURRENT_PG_VERSION|$ext|$pkg|$old_ver|$new_ver" >>"$MAJOR_UPDATES_FILE"
						fi
					fi
				elif [ -n "$old_match" ]; then
					old_ver="${old_match#"$pkg "}"
					echo "| $pkg | $old_ver | - | REMOVED |"
				elif [ -n "$new_match" ]; then
					new_ver="${new_match#"$pkg "}"
					echo "| $pkg | - | $new_ver | ADDED |"
				fi
			done

			echo ""

			# Add raw nix-store output
			echo ""
			echo "<details>"
			echo "<summary>Raw Dependency Tree</summary>"
			echo ""
			echo '```'
			echo "Old ($old_so):"
			echo "$old_deps"
			echo ""
			echo "New ($new_so):"
			echo "$new_deps"
			echo '```'
			echo ""
			echo "</details>"
			echo ""
		fi
	done
}

# Function to generate summary of MAJOR updates
generate_summary() {
	if [ ! -s "$MAJOR_UPDATES_FILE" ]; then
		echo "## Summary"
		echo ""
		echo "No extensions had dependencies with MAJOR version updates."
		echo ""
	else
		echo "## Summary"
		echo ""
		echo "The following extensions have dependencies that underwent **MAJOR** version updates:"
		echo ""
		echo "| PostgreSQL Version | Extension | Dependency | Old Version | New Version |"
		echo "|--------------------|-----------|------------|-------------|-------------|"

		while IFS='|' read -r pg_ver ext dep old_ver new_ver; do
			echo "| $pg_ver | $ext | $dep | $old_ver | $new_ver |"
		done <"$MAJOR_UPDATES_FILE"

		echo ""
	fi
}

# Redirect analysis output to file (wrap in details/summary for collapsible section)
{
	echo "<details>"
	echo "<summary>Full Analysis Results</summary>"
	echo ""

	# Analyze all three variants
	analyze_variant_extension_deps "15" "PostgreSQL 15" "psql_15"
	analyze_variant_extension_deps "17" "PostgreSQL 17" "psql_17"
	analyze_variant_extension_deps "orioledb-17" "OrioleDB 17" "psql_orioledb-17"

	echo "</details>"
} >>"$OUTPUT_FILE"

# Generate and insert summary at the top of results
SUMMARY_CONTENT=$(generate_summary)

# Insert summary after the header but before PostgreSQL version sections
# We need to insert it after the header (line with "Analysis Date") and before first "##" heading
if [[ $OSTYPE == "darwin"* ]]; then
	# macOS - create temp file with proper structure
	{
		# Read header (including bullet point lines)
		sed -n '1,/^- \*\*Analysis Date:/p' "$OUTPUT_FILE"
		echo ""
		# Insert summary
		echo "$SUMMARY_CONTENT"
		# Append rest of file (everything after the header)
		sed -n '/^- \*\*Analysis Date:/,$p' "$OUTPUT_FILE" | tail -n +2
	} >"$OUTPUT_FILE.tmp"
	mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
else
	# GNU/Linux - similar approach
	{
		sed -n '1,/^- \*\*Analysis Date:/p' "$OUTPUT_FILE"
		echo ""
		echo "$SUMMARY_CONTENT"
		sed -n '/^- \*\*Analysis Date:/,$p' "$OUTPUT_FILE" | tail -n +2
	} >"$OUTPUT_FILE.tmp"
	mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
fi

echo "Analysis complete!"
echo "Results written to: $OUTPUT_FILE"
