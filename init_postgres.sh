#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE USER supabase_admin LOGIN CREATEROLE CREATEDB REPLICATION BYPASSRLS;

    -- Supabase super admin
    CREATE USER supabase_auth_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION PASSWORD 'root';
    CREATE SCHEMA IF NOT EXISTS $DB_NAMESPACE AUTHORIZATION supabase_auth_admin;
    GRANT CREATE ON DATABASE postgres TO supabase_auth_admin;
    ALTER USER supabase_auth_admin SET search_path = '$DB_NAMESPACE';
EOSQL
