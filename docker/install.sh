#!/usr/bin/env bash
#
# install.sh — One-shot, autonomous installer for THIS self-hosted Supabase fork,
# including the "Sites" web-hosting product and self-hosted edge-function
# management (Studio is built from local source so those features are present).
#
# What it does, end to end:
#   1. Asks for the dashboard login/password you want (or generates a password).
#   2. Installs ALL system dependencies: apt update + apt upgrade, then Docker
#      Engine + CLI + containerd + the buildx & compose v2 plugins (official repo),
#      plus openssl, git, jq, curl, gnupg. Fixes "docker compose: unknown flag -f".
#   3. (Optional) Adds a swapfile on low-RAM hosts so the Studio build won't OOM.
#   4. Generates ALL secrets and API keys into docker/.env
#      (legacy HS256 keys + asymmetric ES256/JWKS + opaque keys + a hosting token).
#   5. Wires the overrides: the web-hosting stack (nginx + hosting-agent + SFTP +
#      edge-function secrets env_file) plus EITHER building Studio from source
#      (default) OR pulling a prebuilt fork image (--studio-image <ref>).
#   6. Builds/pulls and starts the full stack, waits for health.
#   7. Prints AND saves every URL, login, password and secret to
#      docker/ACCESS-CREDENTIALS.txt (chmod 600).
#
# Run as root from the FULL repo (apps/studio must be present), e.g.:
#   bash docker/install.sh
#   DOMAIN=supa.example.com EMAIL=you@example.com bash docker/install.sh
#   bash docker/install.sh --user admin --password 's3cret' --domain supa.example.com --email you@example.com
#
# Flags / env vars:
#   --user <u>     | DASHBOARD_USERNAME   Desired dashboard username (prompted; default supabase).
#   --password <p> | DASHBOARD_PASSWORD   Desired dashboard password (prompted; blank = generated).
#   --domain <d>   | DOMAIN   Public domain pointing at this server (enables real TLS).
#                            Omit for local/IP mode (self-signed cert, dashboard on :8000).
#   --email  <e>   | EMAIL    Let's Encrypt contact email (default: admin@<domain>).
#   --studio-image <ref> | STUDIO_IMAGE  Pull a prebuilt Studio image instead of
#                           building on this host (best for small servers), e.g.
#                           ghcr.io/<owner>/supabase-studio:fork.
#   --enable-ftps            Also start the FTPS service (off by default).
#   --skip-deps             Don't install system packages (also skips apt upgrade).
#   --reset-secrets         Regenerate .env even if it already exists (DESTRUCTIVE for an
#                           existing database — only on a fresh install).
#   --no-swap               Never create a swapfile.
#   -y, --yes               Non-interactive: don't prompt; use flags/env/defaults.
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
DASH_USER="${DASHBOARD_USERNAME:-}"
DASH_PASS="${DASHBOARD_PASSWORD:-}"
ENABLE_FTPS=0
SKIP_DEPS=0
RESET_SECRETS=0
NO_SWAP=0
ASSUME_YES=0
STUDIO_IMAGE="${STUDIO_IMAGE:-}"

while [ $# -gt 0 ]; do
  case "$1" in
    --user)     DASH_USER="${2:-}"; shift 2 ;;
    --password) DASH_PASS="${2:-}"; shift 2 ;;
    --studio-image) STUDIO_IMAGE="${2:-}"; shift 2 ;;
    --domain) DOMAIN="${2:-}"; shift 2 ;;
    --email)  EMAIL="${2:-}";  shift 2 ;;
    --enable-ftps)   ENABLE_FTPS=1; shift ;;
    --skip-deps)     SKIP_DEPS=1;   shift ;;
    --reset-secrets) RESET_SECRETS=1; shift ;;
    --no-swap)       NO_SWAP=1;     shift ;;
    -y|--yes)        ASSUME_YES=1;  shift ;;
    -h|--help)       awk 'NR==1{next} /^#/{sub(/^# ?/,"");print;next} {exit}' "$0"; exit 0 ;;
    *) die "Unknown argument: $1 (use --help)" ;;
  esac
done

# ----------------------------------------------------------------------------
# Locate repo / docker dir; sanity-check we have the source to build Studio
# ----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$SCRIPT_DIR"
REPO_ROOT="$(cd "$DOCKER_DIR/.." && pwd)"

# Studio image strategy: build from source (default) or pull a prebuilt image.
if [ -n "$STUDIO_IMAGE" ]; then STUDIO_MODE="image"; else STUDIO_MODE="build"; fi

[ -f "$DOCKER_DIR/docker-compose.yml" ] || die "docker-compose.yml not found in $DOCKER_DIR"
[ -f "$DOCKER_DIR/docker-compose.local.yml" ] || die "docker-compose.local.yml missing — this installer needs the fork override."
if [ "$STUDIO_MODE" = "build" ]; then
  [ -f "$DOCKER_DIR/docker-compose.studio-build.yml" ] || die "docker-compose.studio-build.yml missing."
  [ -f "$REPO_ROOT/apps/studio/Dockerfile" ] || die "apps/studio/Dockerfile missing. You only have the docker/ folder — clone the FULL repo to build Studio, or use --studio-image <ref> to pull a prebuilt image."
else
  [ -f "$DOCKER_DIR/docker-compose.studio-image.yml" ] || die "docker-compose.studio-image.yml missing."
fi

# Root / sudo
if [ "$(id -u)" -eq 0 ]; then SUDO=""; else
  command -v sudo >/dev/null 2>&1 || die "Run as root or install sudo."
  SUDO="sudo"
fi

cd "$DOCKER_DIR"

# ----------------------------------------------------------------------------
# 1. System dependencies
# ----------------------------------------------------------------------------
setup_docker_repo() {
  # Configure Docker's official APT repository (Debian/Ubuntu, idempotent).
  local distro codename arch
  # shellcheck disable=SC1091
  . /etc/os-release 2>/dev/null || true
  distro="${ID:-debian}"; case "$distro" in ubuntu|debian) ;; *) distro="debian" ;; esac
  codename="${VERSION_CODENAME:-}"; [ -n "$codename" ] || codename="$(lsb_release -cs 2>/dev/null || echo bookworm)"
  arch="$(dpkg --print-architecture 2>/dev/null || echo amd64)"
  $SUDO install -m 0755 -d /etc/apt/keyrings
  $SUDO curl -fsSL "https://download.docker.com/linux/${distro}/gpg" -o /etc/apt/keyrings/docker.asc
  $SUDO chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=${arch} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/${distro} ${codename} stable" \
    | $SUDO tee /etc/apt/sources.list.d/docker.list >/dev/null
  $SUDO apt-get update -qq
}

install_deps() {
  if [ "$SKIP_DEPS" -eq 1 ]; then log "Skipping dependency installation (--skip-deps)"; return; fi
  log "Installing system dependencies (apt update + upgrade + Docker & plugins)"

  if command -v apt-get >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    local APT_OPTS; APT_OPTS=(-y -o Dpkg::Options::=--force-confold -o Dpkg::Options::=--force-confdef)
    # Heal a previously interrupted apt/dpkg run (common on cheap VPS) so the
    # prerequisite install below doesn't abort with "dpkg was interrupted".
    $SUDO dpkg --configure -a 2>/dev/null || true
    $SUDO apt-get install -f "${APT_OPTS[@]}" -qq >/dev/null 2>&1 || true
    $SUDO apt-get update -qq
    log "Upgrading existing packages (apt upgrade)"
    $SUDO apt-get upgrade "${APT_OPTS[@]}" -qq >/dev/null 2>&1 || warn "apt upgrade reported issues (continuing)"
    log "Installing prerequisites"
    $SUDO apt-get install "${APT_OPTS[@]}" -qq \
      ca-certificates curl gnupg openssl git jq lsb-release apt-transport-https >/dev/null
    ok "base packages (curl, gnupg, openssl, git, jq, lsb-release)"

    if ! command -v docker >/dev/null 2>&1; then
      log "Installing Docker Engine + CLI + containerd + buildx + compose (official repo)"
      setup_docker_repo
      $SUDO apt-get install "${APT_OPTS[@]}" -qq \
        docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin >/dev/null \
        || { warn "Repo install failed — falling back to get.docker.com"; curl -fsSL https://get.docker.com | $SUDO sh; }
      ok "Docker Engine + plugins installed"
    else
      ok "Docker already present ($(docker --version | awk '{print $3}' | tr -d ,))"
      if ! docker compose version >/dev/null 2>&1 || ! docker buildx version >/dev/null 2>&1; then
        log "Adding missing Docker plugins (compose / buildx)"
        [ -f /etc/apt/sources.list.d/docker.list ] || setup_docker_repo
        $SUDO apt-get install "${APT_OPTS[@]}" -qq docker-buildx-plugin docker-compose-plugin >/dev/null 2>&1 || true
      fi
    fi
  else
    warn "Non-apt distro: install Docker + the compose & buildx plugins manually."
    command -v docker >/dev/null 2>&1 || curl -fsSL https://get.docker.com | $SUDO sh
  fi

  # Ensure the Compose plugin works (static-binary fallback as a last resort).
  if ! docker compose version >/dev/null 2>&1; then
    local arch; arch="$(uname -m)"; case "$arch" in x86_64) arch=x86_64 ;; aarch64|arm64) arch=aarch64 ;; esac
    $SUDO mkdir -p /usr/local/lib/docker/cli-plugins
    $SUDO curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-${arch}" \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    $SUDO chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
  fi
  docker compose version >/dev/null 2>&1 || die "Docker Compose plugin is not available."
  ok "Compose plugin ready ($(docker compose version --short 2>/dev/null))"
  if docker buildx version >/dev/null 2>&1; then ok "buildx ready"; else warn "buildx unavailable — classic builder will be used (slower)."; fi

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
  [ "$STUDIO_MODE" = "image" ] && return   # no on-host build → no big RAM need
  local mem_kb swap_kb
  mem_kb=$(awk '/MemTotal/{print $2}' /proc/meminfo 2>/dev/null || echo 0)
  swap_kb=$(awk '/SwapTotal/{print $2}' /proc/meminfo 2>/dev/null || echo 0)
  # Building Studio (Next.js) needs ~4-6 GB. Add swap when RAM+swap looks short.
  if [ "$mem_kb" -gt 0 ] && [ "$mem_kb" -lt 6291456 ] && [ "$swap_kb" -lt 2097152 ]; then
    if [ ! -f /swapfile ]; then
      log "RAM is $((mem_kb/1024)) MB — creating an 8G swapfile so the Studio build is not OOM-killed (use --no-swap to skip, or --studio-image to avoid building)"
      $SUDO fallocate -l 8G /swapfile 2>/dev/null || $SUDO dd if=/dev/zero of=/swapfile bs=1M count=8192 status=none
      $SUDO chmod 600 /swapfile
      $SUDO mkswap /swapfile >/dev/null
      $SUDO swapon /swapfile
      grep -q '/swapfile' /etc/fstab 2>/dev/null || echo '/swapfile none swap sw 0 0' | $SUDO tee -a /etc/fstab >/dev/null
      ok "8G swap enabled"
    else
      warn "/swapfile already exists ($((swap_kb/1024)) MB swap total) — not creating another. If the build still OOMs, add more swap or use --studio-image."
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
# Ask for the desired dashboard login / password (interactive; flags/env override)
# ----------------------------------------------------------------------------
prompt_credentials() {
  log "Dashboard (Studio) login"
  if [ -z "$DASH_USER" ]; then
    if [ "$ASSUME_YES" -eq 0 ] && [ -t 0 ]; then
      printf "  Choose a dashboard username [supabase]: "; read -r DASH_USER || true
    fi
    [ -n "$DASH_USER" ] || DASH_USER="supabase"
  fi
  # Reject passwords Docker Compose would re-interpret ($ and \), or the printed
  # password would not match the one the containers actually receive.
  if [ -n "$DASH_PASS" ]; then
    case "$DASH_PASS" in
      *'$'*|*'\'*) die "Dashboard password must not contain '\$' or '\\' (Docker Compose re-interprets them). Use a different --password." ;;
    esac
  fi
  if [ -z "$DASH_PASS" ]; then
    if [ "$ASSUME_YES" -eq 0 ] && [ -t 0 ]; then
      local p2
      while :; do
        printf "  Choose a dashboard password (blank = auto-generate): "; read -rs DASH_PASS || true; echo
        [ -z "$DASH_PASS" ] && { warn "No password entered — a strong one will be generated."; break; }
        case "$DASH_PASS" in *'$'*|*'\'*) warn "Avoid '\$' and '\\' (Compose re-interprets them) — choose another."; DASH_PASS=""; continue ;; esac
        printf "  Confirm password: "; read -rs p2 || true; echo
        [ "$DASH_PASS" = "$p2" ] && break
        warn "Passwords did not match — try again."
      done
    fi
  fi
  ok "Username: ${DASH_USER}$([ -n "$DASH_PASS" ] && echo '  (custom password set)' || echo '  (password will be generated)')"
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

  # Dashboard login: apply the chosen username, and the chosen password if any
  # (otherwise keep the strong one generated by generate-keys.sh).
  set_env DASHBOARD_USERNAME "${DASH_USER:-supabase}"
  if [ -n "$DASH_PASS" ]; then set_env DASHBOARD_PASSWORD "$DASH_PASS"; fi
  ok "Dashboard credentials configured (user: ${DASH_USER:-supabase})"

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

  # Make plain `docker compose ...` pick up the right overrides too.
  if [ "$STUDIO_MODE" = "image" ]; then
    set_env STUDIO_IMAGE "$STUDIO_IMAGE"
    set_env COMPOSE_FILE "docker-compose.yml:docker-compose.local.yml:docker-compose.studio-image.yml"
    ok "Studio image: $STUDIO_IMAGE (wired into COMPOSE_FILE)"
  else
    set_env COMPOSE_FILE "docker-compose.yml:docker-compose.local.yml:docker-compose.studio-build.yml"
    ok "Overrides wired into COMPOSE_FILE (build Studio from source)"
  fi

  # Tidy a stale non-secret identifier; if FTPS is enabled, ensure it has a password.
  [ "$(get_env POOLER_TENANT_ID)" = "your-tenant-id" ] && set_env POOLER_TENANT_ID "supabase"
  if [ "$ENABLE_FTPS" -eq 1 ] && { [ -z "$(get_env FTPS_PASS)" ] || [ "$RESET_SECRETS" -eq 1 ]; }; then
    set_env FTPS_PASS "$(openssl rand -hex 16)"
    ok "FTPS password generated"
  fi
}

# ----------------------------------------------------------------------------
# 4. Directories / placeholder files
# ----------------------------------------------------------------------------
prepare_dirs() {
  log "Preparing host directories"
  mkdir -p volumes/www volumes/sftp/ssh volumes/proxy/nginx/sites volumes/functions
  # env_file target must exist for older Compose versions; empty is fine.
  [ -f volumes/functions/.env ] || { printf '%s\n' '# Managed by Supabase Studio — edge function secrets' > volumes/functions/.env; }
  # Persistent SFTP host keys so the fingerprint stays stable across restarts.
  if command -v ssh-keygen >/dev/null 2>&1 && [ -z "$(ls -A volumes/sftp/ssh 2>/dev/null)" ]; then
    ssh-keygen -t ed25519 -f volumes/sftp/ssh/ssh_host_ed25519_key -N '' -q 2>/dev/null || true
    ssh-keygen -t rsa -b 4096 -f volumes/sftp/ssh/ssh_host_rsa_key -N '' -q 2>/dev/null || true
    ok "SFTP host keys generated (stable fingerprint)"
  fi
  ok "volumes/www, volumes/sftp/ssh, volumes/proxy/nginx/sites, volumes/functions"
}

# ----------------------------------------------------------------------------
# 5. Build + up + wait
# ----------------------------------------------------------------------------
if [ "$STUDIO_MODE" = "image" ]; then
  COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.local.yml -f docker-compose.studio-image.yml)
else
  COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.local.yml -f docker-compose.studio-build.yml)
fi
PROFILE_ARGS=()
[ "$ENABLE_FTPS" -eq 1 ] && PROFILE_ARGS=(--profile ftps)

build_and_up() {
  if [ "$STUDIO_MODE" = "image" ]; then
    log "Pulling images (Studio: $STUDIO_IMAGE) and starting the stack"
    "${COMPOSE[@]}" "${PROFILE_ARGS[@]}" pull
    "${COMPOSE[@]}" "${PROFILE_ARGS[@]}" up -d
  else
    log "Building Studio from source and starting the stack (first build can take several minutes)"
    DOCKER_BUILDKIT=1 "${COMPOSE[@]}" "${PROFILE_ARGS[@]}" up -d --build
  fi
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
  local sp; sp="$(get_env SFTP_PORT)"; [ -n "$sp" ] || sp=2222
  $SUDO ufw allow "${sp}/tcp" >/dev/null 2>&1 || true
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
    echo "  No SFTP user exists by default. Add one PER SITE in"
    echo "  docker/volumes/sftp/users.conf (format: user:pass:e:1001), using the"
    echo "  site's SLUG as the username so uploads land in that site's docroot,"
    echo "  then: $ docker compose restart sftp"
    echo
    echo "EDGE FUNCTIONS"
    echo "  Manage code + secrets from Studio → Edge Functions (self-hosted write path)."
    echo "  Secrets are written to volumes/functions/.env and injected via env_file;"
    echo "  after changing secrets: $ docker compose restart functions"
    echo
    echo "ALL SECRETS (keep this file private — full machine config lives in docker/.env)"
    for k in DASHBOARD_USERNAME DASHBOARD_PASSWORD \
             POSTGRES_PASSWORD JWT_SECRET ANON_KEY SERVICE_ROLE_KEY \
             SUPABASE_PUBLISHABLE_KEY SUPABASE_SECRET_KEY \
             ANON_KEY_ASYMMETRIC SERVICE_ROLE_KEY_ASYMMETRIC \
             SECRET_KEY_BASE VAULT_ENC_KEY PG_META_CRYPTO_KEY \
             LOGFLARE_PUBLIC_ACCESS_TOKEN LOGFLARE_PRIVATE_ACCESS_TOKEN \
             S3_PROTOCOL_ACCESS_KEY_ID S3_PROTOCOL_ACCESS_KEY_SECRET \
             HOSTING_AGENT_TOKEN; do
      v="$(get_env "$k")"; [ -n "$v" ] && printf '  %s=%s\n' "$k" "$v"
    done
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
  ok "Saved logins, passwords and all secrets to: $out  (chmod 600)"
  echo
  printf "${C_YLW}Open these ports on your cloud firewall/security group if not already: 80, 443, 8000, %s%s${C_RESET}\n" \
    "$sftp_port" "$([ "$ENABLE_FTPS" -eq 1 ] && echo ', 21, 40000-40009')"
  [ -n "$DOMAIN" ] && printf "${C_YLW}DNS: make sure %s has an A record pointing to %s for TLS to be issued.${C_RESET}\n" "$DOMAIN" "$PUBLIC_IP"
}

# ----------------------------------------------------------------------------
# Run
# ----------------------------------------------------------------------------
log "Self-hosted Supabase (fork) — autonomous install starting"
prompt_credentials
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
