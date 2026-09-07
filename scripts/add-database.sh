#!/bin/bash
# Usage: ./scripts/add-database.sh --ref my-project --name "My Project" --host db-myproject --password secret
set -e
REF=""
NAME=""
HOST=""
PORT=5432
DATABASE="postgres"
PASSWORD=""
JWT_SECRET=""

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --ref) REF="$2"; shift ;;
    --name) NAME="$2"; shift ;;
    --host) HOST="$2"; shift ;;
    --port) PORT="$2"; shift ;;
    --database) DATABASE="$2"; shift ;;
    --password) PASSWORD="$2"; shift ;;
    --jwt-secret) JWT_SECRET="$2"; shift ;;
    *) echo "Unknown param: $1"; exit 1 ;;
  esac
  shift
done

REGISTRY="${DATABASE_REGISTRY_PATH:-/etc/supabase/databases.json}"
echo "Adding database '$REF' to registry at $REGISTRY"

# Use python3 or jq to update the JSON
python3 -c "
import json, sys, datetime
with open('$REGISTRY') as f:
    reg = json.load(f)
entry = {
  'ref': '$REF',
  'name': '$NAME',
  'host': '$HOST',
  'port': $PORT,
  'database': '$DATABASE',
  'password_env': 'DB_${REF^^}_PASSWORD',
  'jwt_secret_env': 'DB_${REF^^}_JWT_SECRET',
  'created_at': datetime.datetime.utcnow().isoformat() + 'Z'
}
reg['databases'].append(entry)
with open('$REGISTRY', 'w') as f:
    json.dump(reg, f, indent=2)
print('Done.')
"