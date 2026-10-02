#!/usr/bin/env bash
# Adapts wait-margin.jsonl (test/test_helper.exs's WAIT_MARGIN_REPORT) into flaky-events.jsonl's
# schema, so a wait that timed out or ate most of its budget shows up in the same daily digest as
# a genuine test flake - including on a fully green run, which flaky-events.jsonl alone never
# sees.
set -euo pipefail

WAIT_MARGIN_FILE="wait-margin.jsonl"
FLAKY_EVENTS="flaky-events.jsonl"

[ -s "$WAIT_MARGIN_FILE" ] || exit 0

touch "$FLAKY_EVENTS"

jq -c \
  --arg run_id "${GITHUB_RUN_ID:-}" \
  --arg postgres "${MATRIX_POSTGRES:-}" \
  --arg partition "${MIX_TEST_PARTITION:-}" \
  --arg job_url "${JOB_URL:-}" \
  '{
    file: (.file // ""),
    line: (.line // 0),
    test: "",
    run_id: $run_id,
    snippet: (
      "\(.construct // .wait_type): \(.result)\n"
      + "evaluations: \(.evaluations)"
      + (if .budget then " / budget \(.budget)" else "" end)
      + "\n"
      + "timeout: \(.timeout)ms, duration: \(.duration_ms)ms"
    ),
    postgres: $postgres,
    partition: $partition,
    job_url: $job_url,
    kind: "wait_margin"
  }' "$WAIT_MARGIN_FILE" >> "$FLAKY_EVENTS"
