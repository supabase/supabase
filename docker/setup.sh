#!/bin/sh
#
# Bootstrap a self-hosted Supabase project on Linux (Debian/Ubuntu or RHEL/CentOS/Fedora).
#
# What it does:
#   1. Installs prerequisites: git, curl, openssl, jq, ca-certificates
#   2. Installs Docker Engine + Compose plugin (if missing)
#   3. Optionally installs the AWS CLI v2 (--with-aws)
#   4. Sparse-clones the repo to extract the contents of ./docker
#   5. Creates a project directory in CWD and copies docker/* into it
#   6. Prompts for the main URLs and writes them to .env
#   7. Generates secrets and asymmetric API keys via utils/*.sh
#
# Usage:
#   sh setup.sh                            # interactive
#   sh setup.sh -y                         # accept defaults, no prompts
#   sh setup.sh --project-dir my-supabase  # name the project directory
#   sh setup.sh --skip-deps                # skip system-package installation
#   sh setup.sh --with-aws                 # also install the AWS CLI v2
#
#   curl -fsSL <url-to-this-script> | sh   # bootstrap from scratch in CWD
#

set -e

PROJECT_DIR="supabase-project"
SKIP_DEPS=0
WITH_AWS=0
ASSUME_YES=0

print_help() {
    cat <<EOF
Usage: setup.sh [options]

Options:
  -p, --project-dir <name>  Name of the project directory (default: supabase-project)
      --skip-deps           Skip installation of system packages
      --with-aws            Install the AWS CLI v2
  -y, --yes                 Non-interactive: accept defaults, no prompts
  -h, --help                Show this help and exit
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        -p|--project-dir) PROJECT_DIR="$2"; shift 2 ;;
        --skip-deps) SKIP_DEPS=1; shift ;;
        --with-aws) WITH_AWS=1; shift ;;
        -y|--yes) ASSUME_YES=1; shift ;;
        -h|--help) print_help; exit 0 ;;
        *) echo "Unknown option: $1" >&2; print_help; exit 1 ;;
    esac
done

if [ "$(id -u)" = "0" ]; then
    SUDO=""
else
    SUDO="sudo"
fi

log()  { printf "===> %s\n" "$*"; }
warn() { printf "WARNING: %s\n" "$*" >&2; }
die()  { printf "ERROR: %s\n" "$*" >&2; exit 1; }

# Prompt with a default; echoes the chosen value on stdout.
# Reads from /dev/tty so prompts work even when stdin is a pipe (curl | sh).
# Falls back to the default with -y or when no controlling terminal exists.
ask() {
    # ask <prompt> <default>  -> echoes chosen value
    if [ "$ASSUME_YES" = "1" ] || ! { : > /dev/tty; } 2>/dev/null; then
        printf '%s' "$2"
        return
    fi
    printf "%s [%s]: " "$1" "$2" > /dev/tty
    read -r reply < /dev/tty
    [ -z "$reply" ] && reply="$2"
    printf '%s' "$reply"
}

OS_FAMILY=""
OS_ID=""
OS_CODENAME=""

detect_os() {
    [ -f /etc/os-release ] || die "Cannot detect OS: /etc/os-release missing. Linux only."
    # shellcheck disable=SC1091
    . /etc/os-release
    OS_ID="$ID"
    OS_CODENAME="${VERSION_CODENAME:-}"
    case "$ID" in
        ubuntu|debian) OS_FAMILY="debian" ;;
        centos|rhel|fedora|rocky|almalinux|ol|amzn) OS_FAMILY="rhel" ;;
        *)
            case "${ID_LIKE:-}" in
                *debian*|*ubuntu*) OS_FAMILY="debian" ;;
                *rhel*|*fedora*|*centos*) OS_FAMILY="rhel" ;;
                *) die "Unsupported distribution: $ID" ;;
            esac
            ;;
    esac
    log "Detected OS: $ID ($OS_FAMILY)"
}

pkg_update() {
    if [ "$OS_FAMILY" = "debian" ]; then
        $SUDO apt-get update -qq -y
    else
        $SUDO dnf makecache -q -y || true
    fi
}

pkg_install() {
    if [ "$OS_FAMILY" = "debian" ]; then
        export DEBIAN_FRONTEND=noninteractive
        $SUDO apt-get install -qq -y "$@"
    else
        $SUDO dnf install -q -y "$@"
    fi
}

install_base_packages() {
    log "Installing base packages: git, curl, openssl, jq, ca-certificates"
    pkg_update
    if [ "$OS_FAMILY" = "debian" ]; then
        pkg_install git curl openssl jq ca-certificates \
            apt-transport-https gnupg lsb-release
    else
        pkg_install git curl openssl jq ca-certificates dnf-plugins-core
    fi
}

docker_present() {
    command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1
}

install_docker() {
    if docker_present; then
        log "Docker already installed: $(docker --version)"
        return 0
    fi

    log "Installing Docker Engine and Compose plugin"
    if [ "$OS_FAMILY" = "debian" ]; then
        $SUDO install -m 0755 -d /etc/apt/keyrings
        curl -fsSL "https://download.docker.com/linux/${OS_ID}/gpg" \
            | $SUDO gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
        $SUDO chmod a+r /etc/apt/keyrings/docker.gpg
        codename="${OS_CODENAME:-$(lsb_release -cs 2>/dev/null || echo stable)}"
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${OS_ID} ${codename} stable" \
            | $SUDO tee /etc/apt/sources.list.d/docker.list >/dev/null
        $SUDO apt-get update -y
        pkg_install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    else
        repo_distro="centos"
        case "$OS_ID" in
            fedora) repo_distro="fedora" ;;
            rhel)   repo_distro="rhel" ;;
        esac
        $SUDO dnf config-manager --add-repo "https://download.docker.com/linux/${repo_distro}/docker-ce.repo" 2>/dev/null \
            || $SUDO dnf-3 config-manager --add-repo "https://download.docker.com/linux/${repo_distro}/docker-ce.repo"
        pkg_install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    fi

    log "Enabling and starting docker service"
    $SUDO systemctl enable --now docker || warn "Could not enable docker via systemctl; start it manually."

    docker_present || die "Docker installation finished but 'docker compose' is still unavailable."
}

install_aws() {
    if command -v aws >/dev/null 2>&1; then
        log "AWS CLI already installed: $(aws --version 2>&1)"
        return 0
    fi

    arch=$(uname -m)
    case "$arch" in
        x86_64|amd64)  aws_arch="x86_64" ;;
        aarch64|arm64) aws_arch="aarch64" ;;
        *) die "Unsupported architecture for AWS CLI: $arch" ;;
    esac

    log "Installing AWS CLI v2 (${aws_arch})"
    command -v unzip >/dev/null 2>&1 || pkg_install unzip
    tmp=$(mktemp -d)
    (
        cd "$tmp"
        curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-${aws_arch}.zip" -o awscliv2.zip
        unzip -q -o awscliv2.zip
        $SUDO ./aws/install --bin-dir /usr/local/bin --install-dir /usr/local/aws-cli --update
    )
    rm -rf "$tmp"
}

SRC_DIR=""
SRC_TMP=""

prepare_source() {
    log "Sparse-cloning supabase repo"
    SRC_TMP=$(mktemp -d) || return 1
    git clone --filter=blob:none --no-checkout --depth=1 --quiet \
        https://github.com/supabase/supabase "$SRC_TMP/supabase" 2>/dev/null || \
    { rm -rf "$SRC_TMP"; return 1; }

    cd "$SRC_TMP/supabase" || { rm -rf "$SRC_TMP"; return 1; }
    git sparse-checkout init --cone && \
    git sparse-checkout set docker && \
    git checkout --quiet 2>/dev/null
    SRC_DIR="$PWD/docker"
    cd - > /dev/null
}

cleanup_src_tmp() {
    if [ -n "$SRC_TMP" ] && [ -d "$SRC_TMP" ]; then
        rm -rf "$SRC_TMP"
    fi
}
trap cleanup_src_tmp EXIT

read_env() {
    grep "^$1=" .env 2>/dev/null | head -n1 | cut -d= -f2-
}

# --- Main ---

log "Setup starting in $(pwd)"
log "This may take several minutes..."

if [ "$SKIP_DEPS" = "1" ]; then
    log "Skipping system-package installation (--skip-deps)"
else
    detect_os
    install_base_packages
    install_docker
fi

if [ "$WITH_AWS" = "1" ]; then
    install_aws
fi

# Idempotent re-run: if CWD is already a set-up project, skip bootstrap.
# A clone has docker-compose.yml + utils/ but only .env.example;
# a set-up project also has a real .env.
if [ -f .env ] && [ -f docker-compose.yml ] && [ -d utils ]; then
    log "Already in a Supabase project directory; skipping bootstrap."
    exit 0
fi

prepare_source

target="$(pwd)/$PROJECT_DIR"
if [ -e "$target" ]; then
    die "Target $target already exists. Pick a different name with --project-dir"
fi

log "Creating project at $target"
mkdir -p "$target"
cp -rf "$SRC_DIR/." "$target/"
if [ -f "$target/.env.example" ] && [ ! -f "$target/.env" ]; then
    cp "$target/.env.example" "$target/.env"
fi

cd "$target"

current_public_url=$(read_env SUPABASE_PUBLIC_URL)
current_api_url=$(read_env API_EXTERNAL_URL)
current_site_url=$(read_env SITE_URL)

[ -z "$current_public_url" ] && current_public_url="http://localhost:8000"
[ -z "$current_api_url" ]    && current_api_url="$current_public_url"
[ -z "$current_site_url" ]   && current_site_url="http://localhost:3000"

if [ "$ASSUME_YES" = "1" ] || ! { : > /dev/tty; } 2>/dev/null; then
    log "Non-interactive: keeping default URLs (edit .env to change)"
else
    echo ""
    echo "Configure the main URLs (press Enter to accept the default)."
    echo ""
fi

public_url=$(ask "SUPABASE_PUBLIC_URL (Studio + APIs)" "$current_public_url")
api_url=$(ask   "API_EXTERNAL_URL (Auth callbacks)"   "$public_url")
site_url=$(ask  "SITE_URL (default Auth redirect)"    "$current_site_url")

# Suggest PROXY_DOMAIN from the public_url host (unless it's localhost-ish)
public_host=$(printf '%s' "$public_url" | sed -e 's|^https*://||' -e 's|/.*$||' -e 's|:.*$||')
case "$public_host" in
    localhost|127.*|"") current_proxy_domain=$(read_env PROXY_DOMAIN) ;;
    *)                  current_proxy_domain="$public_host" ;;
esac
[ -z "$current_proxy_domain" ] && current_proxy_domain="your-domain.example.com"

proxy_domain=$(ask "PROXY_DOMAIN (for nginx/caddy HTTPS proxy)" "$current_proxy_domain")

# Derive CERTBOT_EMAIL = admin@<last-two-labels-of-proxy-domain>.
# Naive: doesn't handle ccTLDs like .co.uk; user can edit .env after.
domain_root=$(printf '%s' "$proxy_domain" | awk -F. 'NF>=2 { print $(NF-1)"."$NF; next } { print }')
certbot_email="admin@${domain_root}"
log "Setting CERTBOT_EMAIL=${certbot_email}"

sed -i.old \
    -e "s|^SUPABASE_PUBLIC_URL=.*$|SUPABASE_PUBLIC_URL=${public_url}|" \
    -e "s|^API_EXTERNAL_URL=.*$|API_EXTERNAL_URL=${api_url}|" \
    -e "s|^SITE_URL=.*$|SITE_URL=${site_url}|" \
    -e "s|^PROXY_DOMAIN=.*$|PROXY_DOMAIN=${proxy_domain}|" \
    -e "s|^CERTBOT_EMAIL=.*$|CERTBOT_EMAIL=${certbot_email}|" \
    .env
rm -f .env.old

log "Generating secrets and legacy API keys"
sh utils/generate-keys.sh --update-env

log "Generating asymmetric key pair and opaque API keys"
sh utils/add-new-auth-keys.sh --update-env

log "Pulling Docker images"
docker compose pull || warn "docker compose pull failed; you can retry later."

echo ""
echo "Setup complete. Project ready at: $(pwd)"
echo ""
echo "Next steps:"
echo "  cd $(pwd)"
echo "  sh ./run.sh config"
echo "  sh ./run.sh secrets"
echo "  sh ./run.sh start"
echo ""
echo "To enable docker-compose overrides (pg17, envoy, caddy, nginx, rustfs, s3, logs):"
echo "  sh ./run.sh config add pg17"
echo ""
