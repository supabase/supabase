#!/usr/bin/env bash
#
# install.sh — One-shot, autonomous installer for THIS self-hosted Supabase fork,
# including the "Sites" web-hosting product and self-hosted edge-function
# management (Studio is built from local source so those features are present).
#
# What it does, end to end:
#   1. Installs system dependencies (Docker Engine + Compose v2 plugin, openssl,
#      git, jq, curl) — fixes the common "docker compose: unknown flag -f".
#   2. (Optional) Adds a swapfile on low-RAM hosts so the Studio build won't OOM.
#   3. Generates ALL secrets and API keys into docker/.env
#      (legacy HS256 keys + asymmetric ES256/JWKS + opaque keys + a hosting token).
#   4. Wires the all-in-one override (docker-compose.local.yml): builds Studio from
#      source + nginx + hosting-agent + SFTP + edge-function secrets env_file.
#   5. Builds and starts the full stack, waits for health.
#   6. Prints AND saves every URL, credential and access detail.
#
# Run as root from the FULL repo (apps/studio must be present), e.g.:
#   bash docker/install.sh
#   DOMAIN=supa.example.com EMAIL=you@example.com bash docker/install.sh
#   bash docker/install.sh --domain supa.example.com --email you@example.com --enable-ftps
#
# Flags / env vars:
#   --domain <d> | DOMAIN   Public domain pointing at this server (enables real TLS).
#                           Omit for local/IP mode (self-signed cert, dashboard on :8000).
#   --email  <e> | EMAIL    Let's Encrypt contact email (default: admin@<domain>).
#   --enable-ftps           Also start the FTPS service (off by default).
#   --skip-deps             Don't install system packages.
#   --reset-secrets         Regenerate .env even if it already exists (DESTRUCTIVE for an
#                           existing database — only on a fresh install).
#   --no-swap               Never create a swapfile.
#   -h, --help              Show this help.

set -euo pipefail

# ----------------------------------------------------------------------------
# Pretty logging
# ----------------------------------------------------------------------------
if [ -t 1 ]; then
  C_RESET="\033[0m"; C_B="\033[1m"; C_GRN="\033[32m"; C_YLW="\033[33m"; C_RED="\033[31m"; C_CYN="\033[36m"
else
  C_RESET=""; C_B=""; C_GRN=""; C_YLW=""; C_RED=""; C_CYN=""
fi
log()  { printf "${C_CYN}==>${C_RESET} ${C_B}%s${C_RESET}\n" "$*"; }
ok()   { printf "${C_GRN}  ✓${C_RESET} %s\n" "$*"; }
warn() { printf "${C_YLW}  ! %s${C_RESET}\n" "$*"; }
die()  { printf "${C_RED}✗ %s${C_RESET}\n" "$*" >&2; exit 1; }

# ----------------------------------------------------------------------------
# Args
# ----------------------------------------------------------------------------
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"
ENABLE_FTPS=0
SKIP_DEPS=0
RESET_SECRETS=0
NO_SWAP=0

while [ $# -gt 0 ]; do
  case "$1" in
    --domain) DOMAIN="${2:-}"; shift 2 ;;
    --email)  EMAIL="${2:-}";  shift 2 ;;
    --enable-ftps)   ENABLE_FTPS=1; shift ;;
    --skip-deps)     SKIP_DEPS=1;   shift ;;
    --reset-secrets) RESET_SECRETS=1; shift ;;
    --no-swap)       NO_SWAP=1;     shift ;;
    -y|--yes)        shift ;;
    -h|--help)       sed -n '2,40p' "$0"; exit 0 ;;
    *) die "Unknown argument: $1 (use --help)" ;;
  esac
done

# ----------------------------------------------------------------------------
# Locate repo / docker dir; sanity-check we have the source to build Studio
# ----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$SCRIPT_DIR"
REPO_ROOT="$(cd "$DOCKER_DIR/.." && pwd)"

[ -f "$DOCKER_DIR/docker-compose.yml" ] || die "docker-compose.yml not found in $DOCKER_DIR"
[ -f "$DOCKER_DIR/docker-compose.local.yml" ] || die "docker-compose.local.yml missing — this installer needs the fork override."
[ -f "$REPO_ROOT/apps/studio/Dockerfile" ] || die "apps/studio/Dockerfile missing. You only have the docker/ folder — clone the FULL repo so Studio can be built from source."

# Root / sudo
if [ "$(id -u)" -eq 0 ]; then SUDO=""; else
  command -v sudo >/dev/null 2>&1 || die "Run as root or install sudo."
  SUDO="sudo"
fi

cd "$DOCKER_DIR"

# ----------------------------------------------------------------------------
# 1. System dependencies
# ----------------------------------------------------------------------------
install_deps() {
  if [ "$SKIP_DEPS" -eq 1 ]; then log "Skipping dependency installation (--skip-deps)"; return; fi
  log "Installing system dependencies"

  if command -v apt-get >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    $SUDO apt-get update -qq
    $SUDO apt-get install -y -qq ca-certificates curl openssl git jq >/dev/null
    ok "base packages (curl, openssl, git, jq)"
  else
    warn "Non-apt distro: ensure curl, openssl, git, jq are installed yourself."
  fi

  # Docker Engine
  if ! command -v docker >/dev/null 2>&1; then
    log "Installing Docker Engine (get.docker.com)"
    curl -fsSL https://get.docker.com | $SUDO sh
    ok "Docker installed"
  else
    ok "Docker already present ($(docker --version | awk '{print $3}' | tr -d ,))"
  fi

  # Compose v2 plugin
  if ! docker compose version >/dev/null 2>&1; then
    log "Installing Docker Compose v2 plugin"
    if command -v apt-get >/dev/null 2>&1 && $SUDO apt-get install -y -qq docker-compose-plugin >/dev/null 2>&1; then
      :
    else
      # Fallback: drop the plugin binary in place
      local arch; arch="$(uname -m)"; case "$arch" in x86_64) arch=x86_64 ;; aarch64|arm64) arch=aarch64 ;; esac
      $SUDO mkdir -p /usr/local/lib/docker/cli-plugins
      $SUDO curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-${arch}" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
      $SUDO chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    fi
    docker compose version >/dev/null 2>&1 || die "Compose plugin install failed."
    ok "Compose plugin installed ($(docker compose version --short 2>/dev/null))"
  else
    ok "Compose plugin already present ($(docker compose version --short 2>/dev/null))"
  fi

  # Daemon running?
  if ! docker info >/dev/null 2>&1; then
    log "Starting Docker daemon"
    $SUDO systemctl enable --now docker 2>/dev/null || $SUDO service docker start 2>/dev/null || true
    docker info >/dev/null 2>&1 || die "Docker daemon is not running."
  fi
  ok "Docker daemon is running"
}

# ----------------------------------------------------------------------------
# 2. Swap (prevent OOM during `next build` on small hosts)
# ----------------------------------------------------------------------------
maybe_swap() {
  [ "$NO_SWAP" -eq 1 ] && return
  local mem_kb swap_kb
  mem_kb=$(awk '/MemTotal/{print $2}' /proc/meminfo 2>/dev/null || echo 0)
  swap_kb=$(awk '/SwapTotal/{print $2}' /proc/meminfo 2>/dev/null || echo 0)
  if [ "$mem_kb" -gt 0 ] && [ "$mem_kb" -lt 3145728 ] && [ "$swap_kb" -lt 1048576 ]; then
    if [ ! -f /swapfile ]; then
      log "Low RAM ($((mem_kb/1024)) MB) and little swap — creating a 4G swapfile to avoid an OOM-killed build"
      $SUDO fallocate -l 4G /swapfile 2>/dev/null || $SUDO dd if=/dev/zero of=/swapfile bs=1M count=4096 status=none
      $SUDO chmod 600 /swapfile
      $SUDO mkswap /swapfile >/dev/null
      $SUDO swapon /swapfile
      grep -q '/swapfile' /etc/fstab 2>/dev/null || echo '/swapfile none swap sw 0 0' | $SUDO tee -a /etc/fstab >/dev/null
      ok "4G swap enabled"
    fi
  fi
}

# ----------------------------------------------------------------------------
# Helpers to read/write .env safely (values contain / + = etc.)
# ----------------------------------------------------------------------------
get_env() { grep "^$1=" .env | head -n1 | cut -d= -f2- | tr -d '\r'; }
set_env() {
  local key="$1" val="$2"
  if grep -q "^${key}=" .env; then
    KEY="$key" VAL="$val" awk 'BEGIN{k=ENVIRON["KEY"];v=ENVIRON["VAL"]}
      { if (index($0, k"=")==1) print k"="v; else print }' .env > .env.tmp && mv .env.tmp .env
  else
    printf '%s=%s\n' "$key" "$val" >> .env
  fi
}

# ----------------------------------------------------------------------------
# 3. Secrets / .env
# ----------------------------------------------------------------------------
PUBLIC_IP=""
detect_ip() { PUBLIC_IP="$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || true)"; [ -n "$PUBLIC_IP" ] || PUBLIC_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"; [ -n "$PUBLIC_IP" ] || PUBLIC_IP="localhost"; }

configure_env() {
  detect_ip
  if [ -f .env ] && [ "$RESET_SECRETS" -eq 0 ]; then
    warn ".env already exists — keeping existing secrets (use --reset-secrets to regenerate)."
  else
    [ -f .env ] && { cp .env ".env.bak.$(date +%s)"; warn "Backed up existing .env"; }
    log "Generating secrets and API keys into .env"
    cp .env.example .env
    sh utils/generate-keys.sh --update-env >/dev/null
    ok "core secrets + legacy ANON/SERVICE keys"
    sh utils/add-new-auth-keys.sh --update-env >/dev/null
    ok "asymmetric keys (JWKS) + opaque API keys"
    rm -f .env.old docker-compose.yml.old .env.example.old
  fi

  # Hosting token for the Sites feature
  if [ -z "$(get_env HOSTING_AGENT_TOKEN)" ] || [ "$(get_env HOSTING_AGENT_TOKEN)" = "replace_with_a_long_random_token" ] || [ "$RESET_SECRETS" -eq 1 ]; then
    set_env HOSTING_AGENT_TOKEN "$(openssl rand -hex 32)"
    ok "HOSTING_AGENT_TOKEN generated"
  fi

  # URLs + TLS contact
  if [ -n "$DOMAIN" ]; then
    PUBLIC_URL="https://$DOMAIN"
    [ -n "$EMAIL" ] || EMAIL="admin@$DOMAIN"
    set_env PROXY_DOMAIN "$DOMAIN"
    set_env CERTBOT_EMAIL "$EMAIL"
  else
    PUBLIC_URL="http://$PUBLIC_IP:8000"
    set_env PROXY_DOMAIN "$PUBLIC_IP"
    set_env CERTBOT_EMAIL "${EMAIL:-admin@example.com}"
    warn "No --domain given: local/IP mode. nginx will use a self-signed cert; dashboard is easiest at http://$PUBLIC_IP:8000"
  fi
  set_env SUPABASE_PUBLIC_URL "$PUBLIC_URL"
  set_env API_EXTERNAL_URL "$PUBLIC_URL"
  set_env SITE_URL "$PUBLIC_URL"

  # Make plain `docker compose ...` pick up the override too
  set_env COMPOSE_FILE "docker-compose.yml:docker-compose.local.yml"
  ok "Override wired into COMPOSE_FILE"
}

# ----------------------------------------------------------------------------
# 4. Directories / placeholder files
# ----------------------------------------------------------------------------
prepare_dirs() {
  log "Preparing host directories"
  mkdir -p volumes/www volumes/sftp/ssh volumes/proxy/nginx/sites volumes/functions
  # env_file target must exist for older Compose versions; empty is fine.
  [ -f volumes/functions/.env ] || { printf '%s\n' '# Managed by Supabase Studio — edge function secrets' > volumes/functions/.env; }
  ok "volumes/www, volumes/sftp/ssh, volumes/proxy/nginx/sites, volumes/functions"
}

# ----------------------------------------------------------------------------
# 5. Build + up + wait
# ----------------------------------------------------------------------------
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.local.yml)
PROFILE_ARGS=()
[ "$ENABLE_FTPS" -eq 1 ] && PROFILE_ARGS=(--profile ftps)

build_and_up() {
  log "Building Studio from source and starting the stack (first build can take several minutes)"
  DOCKER_BUILDKIT=1 "${COMPOSE[@]}" "${PROFILE_ARGS[@]}" up -d --build
  ok "Containers started"
}

wait_healthy() {
  log "Waiting for services to become healthy"
  local name="$1" tries="${2:-120}" i status
  for i in $(seq 1 "$tries"); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$name" 2>/dev/null || echo missing)"
    case "$status" in
      healthy|running) ok "$name: $status"; return 0 ;;
      missing) sleep 3 ;;
      *) printf "\r    %s: %s (%ds) " "$name" "$status" "$((i*3))"; sleep 3 ;;
    esac
  done
  printf "\n"; warn "$name did not report healthy in time — check: ${COMPOSE[*]} logs $name"
  return 1
}

# ----------------------------------------------------------------------------
# Optional: open firewall ports if ufw is active (always keep SSH open first)
# ----------------------------------------------------------------------------
open_firewall() {
  command -v ufw >/dev/null 2>&1 || return
  ufw status 2>/dev/null | grep -q "Status: active" || return
  log "ufw is active — allowing required ports"
  $SUDO ufw allow 22/tcp   >/dev/null 2>&1 || true
  $SUDO ufw allow 80/tcp   >/dev/null 2>&1 || true
  $SUDO ufw allow 443/tcp  >/dev/null 2>&1 || true
  $SUDO ufw allow 8000/tcp >/dev/null 2>&1 || true
  $SUDO ufw allow "$(get_env SFTP_PORT || echo 2222)/tcp" >/dev/null 2>&1 || true
  [ "$ENABLE_FTPS" -eq 1 ] && { $SUDO ufw allow 21/tcp >/dev/null 2>&1 || true; $SUDO ufw allow 40000:40009/tcp >/dev/null 2>&1 || true; }
  ok "firewall rules added (22, 80, 443, 8000, SFTP)"
}

# ----------------------------------------------------------------------------
# 6. Summary
# ----------------------------------------------------------------------------
print_summary() {
  local du dp anon srk pub sec jwt hat sftp_port
  du="$(get_env DASHBOARD_USERNAME)"; dp="$(get_env DASHBOARD_PASSWORD)"
  anon="$(get_env ANON_KEY)"; srk="$(get_env SERVICE_ROLE_KEY)"
  pub="$(get_env SUPABASE_PUBLISHABLE_KEY)"; sec="$(get_env SUPABASE_SECRET_KEY)"
  jwt="$(get_env JWT_SECRET)"; hat="$(get_env HOSTING_AGENT_TOKEN)"
  sftp_port="$(get_env SFTP_PORT)"; [ -n "$sftp_port" ] || sftp_port=2222
  local pgpass; pgpass="$(get_env POSTGRES_PASSWORD)"

  local out="$DOCKER_DIR/ACCESS-CREDENTIALS.txt"
  {
    echo "==================== SUPABASE SELF-HOSTED — ACCESS ===================="
    echo "Generated: $(date)"
    echo
    echo "STUDIO DASHBOARD"
    if [ -n "$DOMAIN" ]; then
      echo "  URL (TLS)        : https://$DOMAIN"
      echo "  URL (direct/IP)  : http://$PUBLIC_IP:8000"
    else
      echo "  URL              : http://$PUBLIC_IP:8000   (self-signed https://$PUBLIC_IP also works)"
    fi
    echo "  Username         : $du"
    echo "  Password         : $dp"
    echo "  (nginx Basic Auth uses the same dashboard username/password)"
    echo
    echo "API"
    echo "  Base URL         : $PUBLIC_URL"
    echo "  anon key         : $anon"
    echo "  service_role key : $srk"
    echo "  publishable key  : $pub"
    echo "  secret key       : $sec"
    echo "  JWT secret       : $jwt"
    echo
    echo "DATABASE (Postgres via Supavisor)"
    echo "  Host             : $PUBLIC_IP"
    echo "  Port (session)   : 5432    Port (transaction): 6543"
    echo "  User / DB        : postgres / postgres"
    echo "  Password         : $pgpass"
    echo "  Example          : postgresql://postgres:$pgpass@$PUBLIC_IP:5432/postgres"
    echo "  (DB port is only reachable externally if exposed by your compose/network.)"
    echo
    echo "SITES (web hosting)  — manage from Studio → 'Sites'"
    echo "  Served by nginx on ports 80/443 at each site's configured domain."
    echo "  hosting-agent token (internal): $hat"
    echo
    echo "SFTP (upload site files) — host $PUBLIC_IP, port $sftp_port"
    echo "  Add users in docker/volumes/sftp/users.conf (format: user:pass:e:1001),"
    echo "  then: $ docker compose restart sftp"
    echo
    echo "EDGE FUNCTIONS"
    echo "  Manage code + secrets from Studio → Edge Functions (self-hosted write path)."
    echo "  Secrets are written to volumes/functions/.env and injected via env_file;"
    echo "  after changing secrets: $ docker compose restart functions"
    echo
    echo "MANAGE THE STACK (from docker/)"
    echo "  Status : docker compose ps"
    echo "  Logs   : docker compose logs -f <service>"
    echo "  Stop   : docker compose down"
    echo "  Update : docker compose up -d --build"
    echo "======================================================================"
  } | tee "$out"
  chmod 600 "$out"
  echo
  ok "Saved a copy to: $out  (chmod 600)"
  echo
  printf "${C_YLW}Open these ports on your cloud firewall/security group if not already: 80, 443, 8000, %s%s${C_RESET}\n" \
    "$sftp_port" "$([ "$ENABLE_FTPS" -eq 1 ] && echo ', 21, 40000-40009')"
  [ -n "$DOMAIN" ] && printf "${C_YLW}DNS: make sure %s has an A record pointing to %s for TLS to be issued.${C_RESET}\n" "$DOMAIN" "$PUBLIC_IP"
}

# ----------------------------------------------------------------------------
# Run
# ----------------------------------------------------------------------------
log "Self-hosted Supabase (fork) — autonomous install starting"
install_deps
maybe_swap
configure_env
prepare_dirs
build_and_up
open_firewall
wait_healthy supabase-db 60 || true
wait_healthy supabase-kong 80 || true
wait_healthy supabase-studio 120 || true
wait_healthy supabase-nginx 40 || true
echo
log "Done."
print_summary
