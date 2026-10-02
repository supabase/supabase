#!/bin/bash

set -e

CERT_DIR="$1"

# Create certs directory
mkdir -p $CERT_DIR

echo "Generating test certificates for PostgreSQL SSL..."

# 1. Generate CA (Certificate Authority)
echo "1. Generating root..."
openssl genrsa -out $CERT_DIR/ca.key 2048
openssl req -x509 -new -nodes -key $CERT_DIR/ca.key -sha256 -days 365 -out $CERT_DIR/ca.crt -subj "/CN=TestLocalCA"

echo "2. Create server certs..."
openssl genrsa -out $CERT_DIR/server.key 2048
openssl req -new -key $CERT_DIR/server.key -out $CERT_DIR/server.csr -subj "/CN=localhost"
openssl x509 -req -in $CERT_DIR/server.csr -CA $CERT_DIR/ca.crt -CAkey $CERT_DIR/ca.key -CAcreateserial -out $CERT_DIR/server.crt -days 365 -sha256


chmod 600 $CERT_DIR/server.key
chmod 644 $CERT_DIR/server.crt
chmod 644 $CERT_DIR/ca.crt

# Clean up temporary files
rm -f $CERT_DIR/*.csr $CERT_DIR/*.srl $CERT_DIR/*.ext

echo "✓ Certificates generated successfully in $CERT_DIR/"
echo ""
echo "Generated files:"
ls -lh $CERT_DIR/
echo ""
echo "Certificate details:"
openssl x509 -in $CERT_DIR/server.crt -noout -subject -issuer -dates
