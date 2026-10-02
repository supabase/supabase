#!/usr/bin/env bash
set -euo pipefail

CERTS_DIR="$(dirname "$0")/../priv/test/certs"
mkdir -p "$CERTS_DIR"
cd "$CERTS_DIR"

# CA (RSA 2048)
openssl req -x509 -newkey rsa:2048 -keyout ca.key -out ca.crt \
  -days 3650 -nodes -subj "/CN=Supavisor Test CA"

SAN="subjectAltName=DNS:localhost"

# RSA server cert
openssl req -newkey rsa:2048 -keyout server_rsa.key -out server_rsa.csr \
  -nodes -subj "/CN=localhost"
openssl x509 -req -in server_rsa.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out server_rsa.crt -days 3650 -extfile <(echo "$SAN")

# ECDSA server cert (prime256v1)
openssl ecparam -genkey -name prime256v1 -out server_ecdsa.key
openssl req -new -key server_ecdsa.key -out server_ecdsa.csr -subj "/CN=localhost"
openssl x509 -req -in server_ecdsa.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out server_ecdsa.crt -days 3650 -extfile <(echo "$SAN")

# Backward compat: server.{crt,key} = RSA copies
cp server_rsa.crt server.crt
cp server_rsa.key server.key

# Cleanup CSRs and serial
rm -f *.csr *.srl

echo "All certificates generated successfully."
