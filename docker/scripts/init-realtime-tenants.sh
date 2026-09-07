#!/bin/sh
# init-realtime-tenants.sh
# Seeds Realtime tenant records for every database in the registry.
# Runs as a one-shot init container on multi-db stack start.
#
# Env vars expected:
#   DATABASE_REGISTRY_PATH  path to databases.json inside the container
#   REALTIME_URL            e.g. http://realtime:4000
#   ANON_KEY                default project anon JWT
#   POSTGRES_PASSWORD       default project postgres password
#   JWT_SECRET              default project JWT secret

set -e

REGISTRY="${DATABASE_REGISTRY_PATH:-/etc/supabase/databases.json}"
REALTIME_URL="${REALTIME_URL:-http://realtime:4000}"

if [ ! -f "$REGISTRY" ]; then
  echo "ERROR: registry not found at $REGISTRY"
  exit 1
fi

python3 - <<'PYTHON'
import json, os, sys, time, urllib.request, urllib.error

registry_path = os.environ["DATABASE_REGISTRY_PATH"]
realtime_url  = os.environ.get("REALTIME_URL", "http://realtime:4000")

with open(registry_path) as f:
    registry = json.load(f)

databases = registry.get("databases", [])

for db in databases:
    ref      = db["ref"]
    host     = db.get("host", "db")
    port     = db.get("port", 5432)
    database = db.get("database", "postgres")

    # Resolve env vars for secrets — each DB may have its own env key
    pw_env  = db.get("password_env", "POSTGRES_PASSWORD")
    jwt_env = db.get("jwt_secret_env", "JWT_SECRET")
    anon_env = db.get("anon_key_env", "ANON_KEY")
    svc_env  = db.get("service_key_env", "SERVICE_ROLE_KEY")

    password   = os.environ.get(pw_env, "")
    jwt_secret = os.environ.get(jwt_env, "")
    anon_key   = os.environ.get(anon_env, "")

    if not password or not jwt_secret:
        print(f"WARN: skipping tenant '{ref}' — missing {pw_env} or {jwt_env}")
        continue

    tenant_payload = json.dumps({
        "tenant": {
            "name": db.get("name", ref),
            "external_id": ref,
            "jwt_secret": jwt_secret,
            "max_concurrent_users": 200,
            "max_events_per_second": 100,
            "postgres_cdc_default": "postgres_cdc_rls",
            "enable_authorization": False,
            "extensions": [
                {
                    "type": "postgres_cdc_rls",
                    "settings": {
                        "db_name": database,
                        "db_host": host,
                        "db_port": str(port),
                        "db_user": "supabase_realtime_admin",
                        "db_password": password,
                        "db_ssl": "false",
                        "region": "local",
                        "poll_interval_ms": 100,
                        "poll_max_changes": 100,
                        "poll_max_record_bytes": 1048576
                    }
                }
            ]
        }
    }).encode("utf-8")

    url = f"{realtime_url}/api/tenants/{ref}"
    req = urllib.request.Request(
        url,
        data=tenant_payload,
        method="PUT",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {anon_key}",
        }
    )

    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                print(f"OK: registered Realtime tenant '{ref}' (HTTP {resp.status})")
            break
        except urllib.error.HTTPError as e:
            if e.code == 409:
                print(f"OK: tenant '{ref}' already exists (409 Conflict) — skipping")
                break
            print(f"WARN: attempt {attempt}/{max_retries} for '{ref}' failed: HTTP {e.code}")
            if attempt < max_retries:
                time.sleep(3)
        except Exception as e:
            print(f"WARN: attempt {attempt}/{max_retries} for '{ref}' failed: {e}")
            if attempt < max_retries:
                time.sleep(3)
    else:
        print(f"ERROR: could not register Realtime tenant '{ref}' after {max_retries} attempts")
        sys.exit(1)

print("Realtime tenant seeding complete.")
PYTHON