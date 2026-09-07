#!/usr/bin/env python3
"""
Auto-generate docker-compose.multi.yml and .env.multi from
docker/volumes/registry/databases.json.

Usage:
  cd docker/
  python3 generate-multi.py

Regenerate after editing databases.json.
"""

import json
import os
import sys


def load_registry(path: str = "./volumes/registry/databases.json") -> dict:
    if not os.path.exists(path):
        print(f"ERROR: Registry not found at {path}", file=sys.stderr)
        sys.exit(1)
    with open(path) as f:
        return json.load(f)


def generate_compose(databases: list) -> dict:
    # Image tags pulled from the base compose to stay consistent
    auth_img = "supabase/gotrue:v2.189.0"
    rest_img = "postgrest/postgrest:v14.12"
    db_img = "supabase/postgres:17.6.1.136"

    services = {}

    for db in databases:
        ref = db["ref"]
        if ref == "default":
            continue  # default DB is managed by base docker-compose.yml

        host = db.get("host", f"db-{ref}")
        port = db.get("port", 5432)
        database = db.get("database", "postgres")
        pw_env = db.get("password_env", f"DB_{ref.upper().replace('-','_')}_PASSWORD")
        jwt_env = db.get("jwt_secret_env", f"DB_{ref.upper().replace('-','_')}_JWT_SECRET")
        anon_env = db.get("anon_key_env", f"DB_{ref.upper().replace('-','_')}_ANON_KEY")
        svc_env = db.get("service_key_env", f"DB_{ref.upper().replace('-','_')}_SERVICE_KEY")

        # Postgres database container
        services[f"db-{ref}"] = {
            "container_name": f"supabase-db-{ref}",
            "image": db_img,
            "restart": "unless-stopped",
            "healthcheck": {
                "test": ["CMD", "pg_isready", "-U", "postgres", "-h", "localhost"],
                "interval": "5s",
                "timeout": "5s",
                "retries": 10,
            },
            "environment": {
                "POSTGRES_HOST": "/var/run/postgresql",
                "PGPORT": str(port),
                "POSTGRES_PORT": str(port),
                "PGPASSWORD": f"${{{pw_env}}}",
                "POSTGRES_PASSWORD": f"${{{pw_env}}}",
                "PGDATABASE": database,
                "POSTGRES_DB": database,
                "JWT_SECRET": f"${{{jwt_env}}}",
                "JWT_EXP": "${JWT_EXPIRY:-3600}",
            },
            "volumes": [
                f"./volumes/db/realtime.sql:/docker-entrypoint-initdb.d/migrations/99-realtime.sql:Z",
                f"./volumes/db/webhooks.sql:/docker-entrypoint-initdb.d/init-scripts/98-webhooks.sql:Z",
                f"./volumes/db/roles.sql:/docker-entrypoint-initdb.d/init-scripts/99-roles.sql:Z",
                f"./volumes/db/jwt.sql:/docker-entrypoint-initdb.d/init-scripts/99-jwt.sql:Z",
                f"db-{ref}-data:/var/lib/postgresql/data:Z",
                f"./volumes/db/_supabase.sql:/docker-entrypoint-initdb.d/migrations/97-_supabase.sql:Z",
                f"./volumes/db/logs.sql:/docker-entrypoint-initdb.d/migrations/99-logs.sql:Z",
                f"./volumes/db/pooler.sql:/docker-entrypoint-initdb.d/migrations/99-pooler.sql:Z",
                f"db-{ref}-config:/etc/postgresql-custom",
            ],
            "networks": ["supabase_network_multi"],
        }
        # Expose host port if specified in registry
        host_port = db.get("host_port")
        if host_port:
            services[f"db-{ref}"]["ports"] = [f"{host_port}:{port}"]

        # Auth (GoTrue) per-database
        services[f"auth-{ref}"] = {
            "container_name": f"supabase-auth-{ref}",
            "image": auth_img,
            "restart": "unless-stopped",
            "depends_on": {
                f"db-{ref}": {"condition": "service_healthy"},
            },
            "healthcheck": {
                "test": [
                    "CMD",
                    "wget",
                    "--no-verbose",
                    "--tries=1",
                    "--spider",
                    "http://localhost:9999/health",
                ],
                "timeout": "5s",
                "interval": "5s",
                "retries": 3,
            },
            "environment": {
                "GOTRUE_API_HOST": "0.0.0.0",
                "GOTRUE_API_PORT": "9999",
                "API_EXTERNAL_URL": "${API_EXTERNAL_URL}",
                "GOTRUE_DB_DRIVER": "postgres",
                "GOTRUE_DB_DATABASE_URL": f"postgres://supabase_auth_admin:${{{pw_env}}}@{host}:{port}/{database}",
                "GOTRUE_SITE_URL": "${SITE_URL}",
                "GOTRUE_URI_ALLOW_LIST": "${ADDITIONAL_REDIRECT_URLS}",
                "GOTRUE_DISABLE_SIGNUP": "${DISABLE_SIGNUP}",
                "GOTRUE_JWT_ADMIN_ROLES": "service_role",
                "GOTRUE_JWT_AUD": "authenticated",
                "GOTRUE_JWT_DEFAULT_GROUP_NAME": "authenticated",
                "GOTRUE_JWT_EXP": "${JWT_EXPIRY:-3600}",
                "GOTRUE_JWT_SECRET": f"${{{jwt_env}}}",
                "GOTRUE_JWT_ISSUER": "${API_EXTERNAL_URL}",
                "GOTRUE_EXTERNAL_EMAIL_ENABLED": "${ENABLE_EMAIL_SIGNUP}",
                "GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED": "${ENABLE_ANONYMOUS_USERS}",
                "GOTRUE_MAILER_AUTOCONFIRM": "${ENABLE_EMAIL_AUTOCONFIRM}",
            },
            "networks": ["supabase_network_multi"],
        }

        # PostgREST per-database
        services[f"rest-{ref}"] = {
            "container_name": f"supabase-rest-{ref}",
            "image": rest_img,
            "restart": "unless-stopped",
            "depends_on": {
                f"db-{ref}": {"condition": "service_healthy"},
            },
            "command": "postgrest",
            "environment": {
                "PGRST_DB_URI": f"postgres://authenticator:${{{pw_env}}}@{host}:{port}/{database}",
                "PGRST_DB_SCHEMAS": "${PGRST_DB_SCHEMAS:-public,graphql_public}",
                "PGRST_DB_ANON_ROLE": "anon",
                "PGRST_JWT_SECRET": f"${{{jwt_env}}}",
                "PGRST_DB_USE_LEGACY_GUCS": "false",
                "PGRST_APP_SETTINGS_JWT_SECRET": f"${{{jwt_env}}}",
                "PGRST_APP_SETTINGS_JWT_EXP": "${JWT_EXPIRY:-3600}",
            },
            "networks": ["supabase_network_multi"],
        }

    # Registry init service — seeds Realtime tenants once on startup
    services["supabase-registry-init"] = {
        "container_name": "supabase-registry-init",
        "image": "python:3.12-alpine",
        "restart": "no",
        "environment": {
            "DATABASE_REGISTRY_PATH": "/etc/supabase/databases.json",
            "REALTIME_URL": "http://realtime:4000",
            "ANON_KEY": "${ANON_KEY}",
            "POSTGRES_PASSWORD": "${POSTGRES_PASSWORD}",
            "JWT_SECRET": "${JWT_SECRET}",
        },
        "volumes": [
            "./volumes/registry/databases.json:/etc/supabase/databases.json:ro",
            "../scripts/init-realtime-tenants.sh:/init-realtime-tenants.sh:ro",
        ],
        "command": ["sh", "/init-realtime-tenants.sh"],
        "networks": ["supabase_network_multi"],
    }

    # Named volumes for extra databases
    volumes = {}
    for db in databases:
        ref = db["ref"]
        if ref == "default":
            continue
        volumes[f"db-{ref}-data"] = None
        volumes[f"db-{ref}-config"] = None

    output = {
        "name": "supabase-multi",
        "services": services,
        "networks": {
            "supabase_network_multi": {
                "name": "docker_supabase-net",
                "external": True,
            }
        },
    }
    if volumes:
        output["volumes"] = volumes

    return output


def generate_env_template(databases: list) -> str:
    extra_dbs = [db for db in databases if db["ref"] != "default"]
    lines = ["# Multi-database env vars — copy to .env and fill in values", ""]

    for db in extra_dbs:
        ref = db["ref"]
        ref_upper = ref.upper().replace("-", "_")
        lines.append(f"# Database: {db['name']} (ref: {ref})")
        lines.append(f"DB_{ref_upper}_PASSWORD=change-me-strong-password")
        lines.append(f"DB_{ref_upper}_JWT_SECRET=change-me-jwt-secret-at-least-32-chars")
        lines.append(f"DB_{ref_upper}_ANON_KEY=")
        lines.append(f"DB_{ref_upper}_SERVICE_KEY=")
        lines.append("")

    return "\n".join(lines)


def main():
    import yaml  # pyyaml

    registry = load_registry()
    databases = registry["databases"]

    compose = generate_compose(databases)

    # Write compose file next to this script (inside docker/)
    out_compose = "docker-compose.multi.yml"
    with open(out_compose, "w") as f:
        f.write("# Auto-generated by generate-multi.py\n")
        f.write("# Regenerate: python3 docker/generate-multi.py\n")
        f.write(
            "# Usage: docker compose -f docker-compose.yml -f docker-compose.multi.yml up -d\n\n"
        )
        yaml.dump(compose, f, default_flow_style=False, sort_keys=False)

    extra = len(databases) - 1
    print(f"Written: docker/docker-compose.multi.yml ({extra} extra database(s))")

    # Write env template
    env_content = generate_env_template(databases)
    with open(".env.multi", "w") as f:
        f.write(env_content)

    print("Written: docker/.env.multi (env var template)")
    print()
    if extra == 0:
        print("Note: only the default database is in databases.json.")
        print("Add extra entries to volumes/registry/databases.json and regenerate.")
    else:
        print("Next steps:")
        print("  1. Fill in docker/.env.multi values and append to docker/.env")
        print("  2. Start extra services:")
        print("     docker compose -f docker-compose.yml -f docker-compose.multi.yml up -d")


if __name__ == "__main__":
    main()