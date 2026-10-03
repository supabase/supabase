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
TMPDIR_BASE="${TMPDIR:-/tmp}/dependency-diff-$$"
OLD_DIR="$TMPDIR_BASE/base-$BASE_BRANCH"
NEW_DIR="$TMPDIR_BASE/pr-$PR_NUMBER"

echo "Using directories:"
echo "  OLD_DIR: $OLD_DIR"
echo "  NEW_DIR: $NEW_DIR"
echo ""

# Setup output file (use absolute path since we'll be changing directories)
ORIGINAL_DIR="$(pwd)"
OUTPUT_FILE="$ORIGINAL_DIR/postgresql-diff-pr-${PR_NUMBER}.md"
echo "Output will be written to: $OUTPUT_FILE"
echo ""

# Initialize output file with header
cat >"$OUTPUT_FILE" <<EOF
<!-- dependency-diff-analysis -->
# PostgreSQL Package Dependency Analysis: PR #${PR_NUMBER}

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
	rm -f /tmp/old-*-names-$$.txt /tmp/new-*-names-$$.txt
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
nix build --accept-flake-config ".#psql_15/bin" -o result-psql_15
nix build --accept-flake-config ".#psql_17/bin" -o result-psql_17
nix build --accept-flake-config ".#psql_orioledb-17/bin" -o result-psql_orioledb-17

echo ""
echo "Building in $NEW_DIR..."
cd "$NEW_DIR"
nix build --accept-flake-config ".#psql_15/bin" -o result-psql_15
nix build --accept-flake-config ".#psql_17/bin" -o result-psql_17
nix build --accept-flake-config ".#psql_orioledb-17/bin" -o result-psql_orioledb-17

echo ""

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

# Function to analyze a PostgreSQL variant
analyze_variant_deps() {
	local variant="$1"
	local variant_name="$2"
	local result_suffix="$3"

	# Check if both result symlinks exist
	if [ ! -e "$OLD_DIR/result-$result_suffix" ] || [ ! -e "$NEW_DIR/result-$result_suffix" ]; then
		echo "## $variant_name Dependency Changes"
		echo ""
		echo "Skipping $variant_name (not built in one or both directories)"
		echo ""
		return
	fi

	echo "## $variant_name Dependency Changes"
	echo ""

	# Export variant for use in subshell
	export CURRENT_PG_VERSION="$variant"

	echo "Extracting $variant_name dependencies..."
	nix path-info -r "$OLD_DIR/result-$result_suffix" 2>/dev/null | sort >"/tmp/old-$variant-deps-$$.txt"
	nix path-info -r "$NEW_DIR/result-$result_suffix" 2>/dev/null | sort >"/tmp/new-$variant-deps-$$.txt"

	# Extract package names
	while read -r path; do
		parse_store_path "$path"
	done <"/tmp/old-$variant-deps-$$.txt" | sort >"/tmp/old-$variant-names-$$.txt"

	while read -r path; do
		parse_store_path "$path"
	done <"/tmp/new-$variant-deps-$$.txt" | sort >"/tmp/new-$variant-names-$$.txt"

	# Compare all packages
	echo "| Package | Old | New | Status |"
	echo "|---------|-----|-----|--------|"

	# Get all unique package names from both old and new
	cat "/tmp/old-$variant-names-$$.txt" "/tmp/new-$variant-names-$$.txt" | cut -d' ' -f1 | sort -u | while read -r pkg; do
		old_match=$(grep "^$pkg " "/tmp/old-$variant-names-$$.txt" | head -1 || echo "")
		new_match=$(grep "^$pkg " "/tmp/new-$variant-names-$$.txt" | head -1 || echo "")

		if [ -n "$old_match" ] && [ -n "$new_match" ]; then
			if [ "$old_match" != "$new_match" ]; then
				# Strip package name prefix to get just the version
				old_ver="${old_match#"$pkg "}"
				new_ver="${new_match#"$pkg "}"
				change_type=$(compare_versions "$old_match" "$new_match")
				echo "| $pkg | $old_ver | $new_ver | $change_type |"

				# Collect MAJOR updates for summary
				if [ "$change_type" = "MAJOR" ]; then
					echo "$CURRENT_PG_VERSION|package|$pkg|$old_ver|$new_ver" >>"$MAJOR_UPDATES_FILE"
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

	# Closure size comparison
	old_closure_bytes=$(nix path-info -S "$OLD_DIR/result-$result_suffix" --json 2>/dev/null | jq -r '.[].closureSize')
	new_closure_bytes=$(nix path-info -S "$NEW_DIR/result-$result_suffix" --json 2>/dev/null | jq -r '.[].closureSize')

	if [ -n "$old_closure_bytes" ] && [ -n "$new_closure_bytes" ]; then
		old_closure_mb=$(numfmt --to-unit=1000000 --format='%.1f' <<<"$old_closure_bytes")
		new_closure_mb=$(numfmt --to-unit=1000000 --format='%.1f' <<<"$new_closure_bytes")
		diff_bytes=$((new_closure_bytes - old_closure_bytes))
		if [ "$diff_bytes" -ge 0 ]; then
			diff_sign="+"
		else
			diff_sign=""
		fi
		diff_mb=$(numfmt --to-unit=1000000 --format='%.1f' <<<"${diff_bytes#-}")
		[ "$diff_bytes" -lt 0 ] && diff_mb="-$diff_mb"

		echo "### Runtime Closure Size"
		echo ""
		echo "| | Size |"
		echo "|--|------|"
		echo "| Old | ${old_closure_mb} MB |"
		echo "| New | ${new_closure_mb} MB |"
		echo "| Delta | ${diff_sign}${diff_mb} MB |"
		echo ""
	fi

	echo "<details>"
	echo "<summary>Raw Dependency Closure</summary>"
	echo ""
	echo '```'
	echo "Old Dependencies (closure: ${old_closure_mb:-?} MB):"
	while read -r path; do
		dep_size=$(nix path-info -S "$path" --json 2>/dev/null | jq -r '.[].narSize' 2>/dev/null || echo "")
		if [ -n "$dep_size" ]; then
			dep_size_hr=$(numfmt --to-unit=1000000 --format='%.1f' <<<"$dep_size")
			printf "  %6s MB  %s\n" "$dep_size_hr" "$path"
		else
			echo "  $path"
		fi
	done <"/tmp/old-$variant-deps-$$.txt"
	echo ""
	echo "New Dependencies (closure: ${new_closure_mb:-?} MB):"
	while read -r path; do
		dep_size=$(nix path-info -S "$path" --json 2>/dev/null | jq -r '.[].narSize' 2>/dev/null || echo "")
		if [ -n "$dep_size" ]; then
			dep_size_hr=$(numfmt --to-unit=1000000 --format='%.1f' <<<"$dep_size")
			printf "  %6s MB  %s\n" "$dep_size_hr" "$path"
		else
			echo "  $path"
		fi
	done <"/tmp/new-$variant-deps-$$.txt"
	echo '```'
	echo ""
	echo "</details>"
	echo ""
}

# Function to generate summary of MAJOR updates
generate_summary() {
	if [ ! -s "$MAJOR_UPDATES_FILE" ]; then
		echo "## Summary"
		echo ""
		echo "No packages had MAJOR version updates."
		echo ""
	else
		echo "## Summary"
		echo ""
		echo "The following packages underwent **MAJOR** version updates:"
		echo ""
		echo "| PostgreSQL Version | Package | Old Version | New Version |"
		echo "|--------------------|---------|-------------|-------------|"

		while IFS='|' read -r pg_ver _ pkg old_ver new_ver; do
			echo "| $pg_ver | $pkg | $old_ver | $new_ver |"
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
	analyze_variant_deps "pg15" "PostgreSQL 15" "psql_15"
	analyze_variant_deps "pg17" "PostgreSQL 17" "psql_17"
	analyze_variant_deps "pgorioledb17" "OrioleDB 17" "psql_orioledb-17"

	echo "</details>"
} >>"$OUTPUT_FILE"

# Generate and insert summary at the top of results
SUMMARY_CONTENT=$(generate_summary)

# Insert summary after the header but before PostgreSQL version sections
# We need to insert it after the header (line with "Analysis Date") and before first "##" heading
{
	sed -n '1,/^- \*\*Analysis Date:/p' "$OUTPUT_FILE"
	echo ""
	echo "$SUMMARY_CONTENT"
	sed -n '/^- \*\*Analysis Date:/,$p' "$OUTPUT_FILE" | tail -n +2
} >"$OUTPUT_FILE.tmp"
mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"

echo "Analysis complete!"
echo "Results written to: $OUTPUT_FILE"
