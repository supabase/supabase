#!/bin/bash
set -e

# Configure PostgreSQL to use SSL
echo "ssl = on" >> /var/lib/postgresql/data/postgresql.conf
echo "ssl_cert_file = '/var/lib/postgresql/server.crt'" >> /var/lib/postgresql/data/postgresql.conf
echo "ssl_key_file = '/var/lib/postgresql/server.key'" >> /var/lib/postgresql/data/postgresql.conf
echo "ssl_ca_file = '/var/lib/postgresql/ca.crt'" >> /var/lib/postgresql/data/postgresql.conf
echo "hba_file = '/etc/postgresql/pg_hba.conf'" >> /var/lib/postgresql/data/postgresql.conf
