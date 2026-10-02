#!/bin/bash

PWD=$(pwd)
K6_VERSION="v0.52.0"
OS="$(uname -s)"
SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")

cd $SCRIPTPATH

if ! command -v npm &> /dev/null; then
    echo "npm is not installed"
    exit 1
fi

if ! command -v k6 &> /dev/null || [[ "$1" = "-f" ]];
then
    case "${OS}" in
        Linux*)
            if (( $EUID != 0 )); then
                echo "Please run as root!"
                exit 1
            fi

            K6_ARCH="$(uname -m)"

            case "${K6_ARCH}" in
                aarch64)
                    K6_ARCH="arm64"
                    ;;

                x86_64)
                    K6_ARCH="amd64"
                    ;;

                *)
                    echo "Unsupported architecture: ${K6_ARCH}"
                    exit 1
            esac

            K6_DIST_LINK="https://github.com/grafana/k6/releases/download/${K6_VERSION}/k6-${K6_VERSION}-linux-${K6_ARCH}.tar.gz"
            K6_FILENAME="k6-${K6_VERSION}-linux-${K6_ARCH}.tar.gz"
            K6_FOLDERNAME="k6-${K6_VERSION}-linux-${K6_ARCH}"

            curl -OL $K6_DIST_LINK --output-dir /tmp
            tar -xzf /tmp/$K6_FILENAME -C /tmp
            sudo mv /tmp/${K6_FOLDERNAME}/k6 /usr/bin/
            chmod +x /usr/bin/k6
            rm -rf /tmp/${K6_FOLDERNAME}
            rm /tmp/$K6_FILENAME
            ;;
        
        Darwin*)
            brew install k6
            ;;

        *)
            echo "Unsupported environment: ${OS}"
            exit 1
    esac
else
    echo "k6 is already installed. Skipping..."
fi

export K6_TARGET="http://127.0.0.1:9998"
export K6_RUN_PROFILE="performance"

npm install

cd $PWD