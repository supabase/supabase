#!/usr/bin/env bash
# Host-side lifecycle for /test-the-docs sandbox.
# Starts a disposable compose project and execs fences inside the runner container.
# Usage:
#   eval "$(./run.sh env)"           # export TTD_* for the session
#   ./run.sh up-stack                # DinD + runner; supabase init/start in /work
#   ./run.sh up-examples             # runner only (no DinD); example-app builds in /work/example
#   ./run.sh exec -- <cmd...>        # run a command in the active runner
#   ./run.sh exec-timeout 60 -- <cmd...>
#   ./run.sh down                    # compose down -v and remove work/output dirs created by this script
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/compose.yaml"

die() {
  echo "error: $*" >&2
  exit 1
}

require_host_prereqs() {
  if [[ "$(id -u)" = "0" ]]; then
    die "refuse to run as root on the host"
  fi
  command -v docker >/dev/null || die "docker not found — install Docker Desktop"
  docker info >/dev/null 2>&1 || die "Docker is not running — start Docker Desktop"
  docker compose version >/dev/null 2>&1 || die "docker compose not available"
}

compose() {
  docker compose -p "${TTD_PROJECT_NAME}" -f "${COMPOSE_FILE}" "$@"
}

runner_service() {
  case "${TTD_PROFILE:-}" in
    stack) echo runner-stack ;;
    examples) echo runner ;;
    *) die "TTD_PROFILE unset; run up-stack or up-examples first" ;;
  esac
}

ensure_state_dir() {
  mkdir -p "${SCRIPT_DIR}/.state"
}

write_env_file() {
  ensure_state_dir
  cat >"${SCRIPT_DIR}/.state/current.env" <<EOF
export TTD_PROJECT_NAME=$(printf '%q' "${TTD_PROJECT_NAME}")
export TTD_WORK_DIR=$(printf '%q' "${TTD_WORK_DIR}")
export TTD_OUTPUT_DIR=$(printf '%q' "${TTD_OUTPUT_DIR}")
export TTD_EXAMPLE_DIR=$(printf '%q' "${TTD_EXAMPLE_DIR}")
export TTD_NETWORK_NAME=$(printf '%q' "${TTD_NETWORK_NAME}")
export TTD_PROFILE=$(printf '%q' "${TTD_PROFILE}")
EOF
}

load_env_file() {
  [[ -f "${SCRIPT_DIR}/.state/current.env" ]] || die "no active sandbox; run up-stack or up-examples first"
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/.state/current.env"
}

cmd_env() {
  require_host_prereqs
  local stamp project work output
  stamp="$(date +%Y%m%d%H%M%S)-$$"
  project="ttd-${stamp}"
  work="$(mktemp -d "${TMPDIR:-/tmp}/ttd-work.XXXXXX")"
  output="$(mktemp -d "${TMPDIR:-/tmp}/ttd-out.XXXXXX")"
  # World-writable so compose user 1001:1001 can write into host bind mounts
  chmod 0777 "${work}" "${output}"
  cat <<EOF
export TTD_PROJECT_NAME=$(printf '%q' "${project}")
export TTD_WORK_DIR=$(printf '%q' "${work}")
export TTD_OUTPUT_DIR=$(printf '%q' "${output}")
export TTD_EXAMPLE_DIR=$(printf '%q' "${TTD_EXAMPLE_DIR:-${SCRIPT_DIR}/.empty}")
export TTD_NETWORK_NAME=$(printf '%q' "${project}-net")
EOF
}

prepare_exports() {
  require_host_prereqs
  if [[ -z "${TTD_PROJECT_NAME:-}" || -z "${TTD_WORK_DIR:-}" || -z "${TTD_OUTPUT_DIR:-}" ]]; then
    eval "$(cmd_env)"
  fi
  export TTD_EXAMPLE_DIR="${TTD_EXAMPLE_DIR:-${SCRIPT_DIR}/.empty}"
  export TTD_NETWORK_NAME="${TTD_NETWORK_NAME:-${TTD_PROJECT_NAME}-net}"
  mkdir -p "${TTD_WORK_DIR}" "${TTD_OUTPUT_DIR}"
  # Re-apply in case dirs were pre-created without cmd_env chmod
  chmod 0777 "${TTD_WORK_DIR}" "${TTD_OUTPUT_DIR}"
}

cmd_up_stack() {
  prepare_exports
  export TTD_PROFILE=stack
  write_env_file
  compose --profile stack build runner-stack
  compose --profile stack up -d --remove-orphans dind runner-stack
  # Wait until the runner can talk to DinD
  compose --profile stack exec -T runner-stack bash -lc '
    set -euo pipefail
    for i in $(seq 1 60); do
      if docker info >/dev/null 2>&1; then
        break
      fi
      sleep 1
    done
    docker info >/dev/null
    cd /work
    if [[ ! -f supabase/config.toml ]]; then
      printf 'n\nn\n' | supabase init
    fi
    supabase start
  '
  echo "sandbox ready: project=${TTD_PROJECT_NAME} work=${TTD_WORK_DIR} profile=stack (DinD)" >&2
}

cmd_up_examples() {
  prepare_exports
  export TTD_PROFILE=examples
  write_env_file
  compose --profile examples build runner
  compose --profile examples up -d --remove-orphans runner
  # Copy read-only mount into writable /work so npm can install without mutating the repo
  compose --profile examples exec -T runner \
    bash -lc 'rm -rf /work/example && mkdir -p /work/example && cp -a /examples/. /work/example/'
  echo "sandbox ready: project=${TTD_PROJECT_NAME} work=${TTD_WORK_DIR} profile=examples (build in /work/example)" >&2
}

cmd_exec() {
  load_env_file
  local svc
  svc="$(runner_service)"
  compose --profile "${TTD_PROFILE}" exec -T "${svc}" "$@"
}

cmd_exec_timeout() {
  load_env_file
  local secs="$1"
  shift
  if [[ "${1:-}" == "--" ]]; then
    shift
  fi
  local svc
  svc="$(runner_service)"
  compose --profile "${TTD_PROFILE}" exec -T "${svc}" \
    timeout --foreground --signal=TERM --kill-after=5s "${secs}s" "$@"
}

cmd_down() {
  if [[ -f "${SCRIPT_DIR}/.state/current.env" ]]; then
    # shellcheck disable=SC1091
    source "${SCRIPT_DIR}/.state/current.env"
  else
    die "no active sandbox state"
  fi
  if [[ "${TTD_PROFILE:-}" == "stack" ]]; then
    compose --profile stack exec -T runner-stack bash -lc 'cd /work && supabase stop 2>/dev/null || true' 2>/dev/null || true
  fi
  compose --profile "${TTD_PROFILE:-stack}" down -v --remove-orphans 2>/dev/null || true
  rm -rf "${TTD_WORK_DIR:-}" "${TTD_OUTPUT_DIR:-}" 2>/dev/null || true
  rm -f "${SCRIPT_DIR}/.state/current.env"
  echo "sandbox torn down: ${TTD_PROJECT_NAME:-unknown}" >&2
}

usage() {
  sed -n '2,10p' "$0" | sed 's/^# //; s/^#//'
}

main() {
  local cmd="${1:-}"
  shift || true
  case "${cmd}" in
    env) cmd_env "$@" ;;
    up-stack) cmd_up_stack "$@" ;;
    up-examples) cmd_up_examples "$@" ;;
    exec)
      if [[ "${1:-}" == "--" ]]; then shift; fi
      cmd_exec "$@"
      ;;
    exec-timeout) cmd_exec_timeout "$@" ;;
    down) cmd_down "$@" ;;
    -h | --help | help | "") usage ;;
    *) die "unknown command: ${cmd}" ;;
  esac
}

main "$@"
