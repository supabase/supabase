#!/bin/bash
set -e

# Add certificate files
cp /tmp/server.crt /var/lib/postgresql/server.crt
cp /tmp/server.key  /var/lib/postgresql/server.key
cp /tmp/ca.crt /var/lib/postgresql/ca.crt

# Update file permissions of certificates
chmod 600 /var/lib/postgresql/server.* /var/lib/postgresql/ca.crt
chown postgres:postgres /var/lib/postgresql/server.* /var/lib/postgresql/ca.crt

# Run the base entrypoint
docker-entrypoint.sh postgres
