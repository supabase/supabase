#!/bin/bash

# Create the certs directory if it doesn't exist
CERTS_DIR="./certs"
mkdir -p "$CERTS_DIR"

# Define cert and key file paths
CERT_FILE="$CERTS_DIR/cert.pem"
KEY_FILE="$CERTS_DIR/key.pem"

# Generate the self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout "$KEY_FILE" -out "$CERT_FILE" -days 365 -nodes \
-set_serial 01 \
-addext "subjectAltName = DNS:supabase-mail" \
-subj "/C=US/ST=State/L=City/O=Company/OU=Department/CN=supabase-mail"

# Output result
if [ $? -eq 0 ]; then
    echo "✅ Certificate and key generated in $CERTS_DIR"
else
    echo "❌ Failed to generate certificate"
fi