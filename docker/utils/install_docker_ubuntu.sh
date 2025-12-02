#!/bin/sh
#
# Based on the DigitalOcean's guide:
# https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-22-04
#

set -e

if command -v docker >/dev/null 2>&1; then
    echo "Docker is already installed."
    printf "Re-install? (y/N) "
    read -r REPLY
    case "$REPLY" in
        [Yy])
            ;;
        *)
            echo "Script canceled."
            exit 1
            ;;
    esac
fi

echo "===> Installing prerequisite packages which let apt use packages over HTTPS..."
sudo apt install apt-transport-https ca-certificates curl software-properties-common

echo "===> Adding the GPG key for the official Docker repository..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "===> Adding the Docker repository to APT sources..."
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "===> Updating existing list of packages..."
sudo apt update

echo "===> Checking Docker repository..."
apt-cache policy docker-ce | head -6 | grep "download.docker.com" > /dev/null 2>&1 || {
    echo "Docker registry isn't found for docker-ce, check configuration..."
    echo "Exiting."
    exit 1
}

echo "===> Installing Docker..."
sudo apt install docker-ce || {
    echo "Failed to install Docker."
    echo "Exiting."
    exit 1
}

echo "===> Checking if Docker is running..."
sudo systemctl status docker 2>&1 | grep -i 'active.*running' || {
    echo "Docker is not running."
    echo "Exiting."
    exit 1
}

echo "===> Checking if Docker Compose is installed..."
docker compose version > /dev/null 2>&1 || {
    echo "Docker Compose not found."
    echo "Exiting."
    exit 1
}

echo "Successfully installed Docker, Docker Compose, and verified their status."
echo ""
