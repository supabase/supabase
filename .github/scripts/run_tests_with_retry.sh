#!/usr/bin/env bash
# Runs the test suite; if it fails with ExUnit test failures, retries
# only the failed tests once. If the retry passes, the failure was a flake:
# report it but exit 0 so CI stays green.
# Any other outcome (compile/infra error, or retry also fails) exits non-zero.
#
# The report is uploading artifacts with a summary of the failure, a daily job 
# picks them up, summarizes them and posts them to slack (`flaky-digest.yml`).
set -euo pipefail

EXPORT_COVERAGE_SUFFIX="$1"

ATTEMPT1_LOG="$(mktemp)"
FLAKY_REPORT="flaky-report.md"
FLAKY_EVENTS="flaky-events.jsonl"
MAX_SNIPPET_CHARS=8000

# Coverage instrumentation is expensive, so only the job that uploads it pays for it.
if [ "${EXPORT_COVERAGE:-false}" = "true" ]; then
  TEST_CMD=(mix coveralls.lcov --partitions 4 --export-coverage "$EXPORT_COVERAGE_SUFFIX" --color)
else
  TEST_CMD=(mix test --partitions 4 --color)
fi

# mix's exit code is data we need to branch on, not an error - suspend
# errexit so a nonzero PIPESTATUS doesn't abort the script before we read it.
set +e
"${TEST_CMD[@]}" 2>&1 | tee "$ATTEMPT1_LOG"
ATTEMPT1_EXIT="${PIPESTATUS[0]}"
set -e

if [ "$ATTEMPT1_EXIT" -eq 0 ]; then
  exit 0
fi

if [ "$ATTEMPT1_EXIT" -ne 2 ]; then
  # ::error::/::warning:: are GitHub Actions workflow commands - the runner
  # turns them into annotations on the job instead of plain log lines.
  echo "::error::Test run failed with exit code $ATTEMPT1_EXIT (not a test failure) - no retry"
  exit "$ATTEMPT1_EXIT"
fi

echo "::warning::Tests failed, retrying only the failed tests once"

ATTEMPT2_LOG="$(mktemp)"
set +e
mix test --failed --color 2>&1 | tee "$ATTEMPT2_LOG"
ATTEMPT2_EXIT="${PIPESTATUS[0]}"
set -e

# ExUnit's --failed manifest does not respect :parameterize params. 
# If a failing parameter variant's manifest entry gets
# overwritten --failed selects nothing, prints this message, and exits
# cleanly without rerunning.
# Treat it as inconclusive rather than trust the exit code, so a genuinely broken
# variant can't hide behind an always-passing sibling forever.
#
# Will fix in ExUnit separately but we then also need to wait for the release of that.
# This is also a good/safe fallback for other such/similar issues, so we don't
# accidentally leak failing tests.
if grep -q "There are no tests to run" "$ATTEMPT2_LOG"; then
  echo "::error::Retry selected no tests to re-run (see script comment for why) - treating as a genuine failure"
  exit 1
fi

if [ "$ATTEMPT2_EXIT" -ne 0 ]; then
  echo "::error::Retry also failed with exit code $ATTEMPT2_EXIT - genuine failure"
  exit "$ATTEMPT2_EXIT"
fi

echo "Retry passed - the original failure was a flake, reporting it"

# Truncate as a bash substring, not via a piped `head -c` - if the sed output
# is longer than the limit, head closes the pipe early and SIGPIPEs sed,
# which then exits non-zero and aborts the whole script even though the
# retry already passed.
SNIPPET="$(sed -n '/^ *[0-9][0-9]*)/,/^Finished in/p' "$ATTEMPT1_LOG" | \
  sed -r 's/\x1b\[[0-9;]*m//g')"
SNIPPET="${SNIPPET:0:$MAX_SNIPPET_CHARS}"

{
  echo "## Flaky test detected"
  echo '```'
  echo "$SNIPPET"
  echo '```'
} > "$FLAKY_REPORT"

cat "$FLAKY_REPORT" >> "$GITHUB_STEP_SUMMARY"

# Code that extracts the relevant data from the detected flakies and writes them into a JSON file

# Create empty flakey file
: > "$FLAKY_EVENTS"

# Structured, one-JSON-object-per-failed-test sibling of the report above -
# lets the daily digest workflow group occurrences by file:line across runs.
# Each ExUnit failure looks like:
#   N) test <name> (<Module>)
#      <file>:<line>
#   ...rest of the block...
# (parameterized tests insert a "Parameters: ..." line before the location;
# module-level failures, e.g. setup_all, have no "test" keyword and no
# location line at all - those are skipped here but still show up in
# flaky-report.md above.)
# `boundaries` is a "<start> <end>" line pair per block (1-indexed, inclusive).
boundaries="$(awk '
  /^ *[0-9]+\) test / { if (start) print start, NR - 1; start = NR; next }
  start && /^Finished in/ { print start, NR - 1; start = 0 }
  END { if (start) print start, NR }
' "$ATTEMPT1_LOG")"

while read -r block_start block_end; do
  [ -z "$block_start" ] && continue

  # Drop bare progress-dot lines - ExUnit's CLI formatter prints these for passing tests as
  # they complete concurrently, and they can land inside a failure block with no diagnostic value.
  block="$(sed -n "${block_start},${block_end}p" "$ATTEMPT1_LOG" | sed -r 's/\x1b\[[0-9;]*m//g' | grep -v -E '^\.+$' || true)"
  # Same broken-pipe risk as the MAX_SNIPPET_CHARS truncation above, so workaround.
  header="${block%%$'\n'*}"
  # The location is a bare "path:line" - strip its indentation before matching.
  error_line="$(printf '%s\n' "$block" | sed -n '2,4p' | sed -E 's/^[[:space:]]*(Error:[[:space:]]*)?//' | grep -m1 -E '^.+:[0-9]+$' || true)"

  test_name="$(printf '%s' "$header" | sed -E 's/^ *[0-9]+\) test (.*) \(([A-Za-z0-9_.]+)\)[[:space:]]*$/\2 \1/')"
  file="$(printf '%s' "$error_line" | sed -E 's/^(.+):[0-9]+$/\1/')"
  line="$(printf '%s' "$error_line" | sed -E 's/^.+:([0-9]+)$/\1/')"
  snippet="${block:0:$MAX_SNIPPET_CHARS}"

  jq -n \
    --arg file "${file:-}" \
    --argjson line "${line:-0}" \
    --arg test "$test_name" \
    --arg run_id "${GITHUB_RUN_ID:-}" \
    --arg snippet "$snippet" \
    --arg postgres "${MATRIX_POSTGRES:-}" \
    --arg partition "${MIX_TEST_PARTITION:-}" \
    --arg job_url "${JOB_URL:-}" \
    '{file: $file, line: $line, test: $test, run_id: $run_id, snippet: $snippet, postgres: $postgres, partition: $partition, job_url: $job_url}' \
    >> "$FLAKY_EVENTS"
done <<< "$boundaries"

exit 0
