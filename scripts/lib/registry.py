#!/usr/bin/env python3
"""registry.py — read/write helper for docker/volumes/registry/databases.json.

CLI usage:
  python3 registry.py list
  python3 registry.py get   <ref>
  python3 registry.py add   <ref> <name> <host> <port> <database>
  python3 registry.py remove <ref>
"""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_PATH = Path(__file__).parent.parent.parent / "docker" / "volumes" / "registry" / "databases.json"


def _path() -> Path:
    env = os.environ.get("DATABASE_REGISTRY_PATH")
    return Path(env) if env else DEFAULT_PATH


def load() -> dict:
    p = _path()
    if not p.exists():
        return {"version": "1", "databases": []}
    with open(p) as f:
        return json.load(f)


def save(reg: dict) -> None:
    p = _path()
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w") as f:
        json.dump(reg, f, indent=2)
        f.write("\n")


def list_databases() -> list:
    return load().get("databases", [])


def get_database(ref: str) -> dict | None:
    return next((db for db in list_databases() if db["ref"] == ref), None)


def add_database(ref: str, name: str, host: str, port: int = 5432, database: str = "postgres") -> dict:
    reg = load()
    if any(db["ref"] == ref for db in reg.get("databases", [])):
        print(f"error: ref '{ref}' already exists.", file=sys.stderr)
        sys.exit(1)
    slug = ref.upper().replace("-", "_")
    entry = {
        "ref": ref,
        "name": name,
        "host": host,
        "port": int(port),
        "database": database,
        "password_env": f"DB_{slug}_PASSWORD",
        "jwt_secret_env": f"DB_{slug}_JWT_SECRET",
        "anon_key_env": f"DB_{slug}_ANON_KEY",
        "service_key_env": f"DB_{slug}_SERVICE_KEY",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    reg.setdefault("databases", []).append(entry)
    save(reg)
    return entry


def remove_database(ref: str) -> dict:
    if ref == "default":
        print("error: Cannot remove the 'default' database.", file=sys.stderr)
        sys.exit(1)
    reg = load()
    before = reg.get("databases", [])
    after = [db for db in before if db["ref"] != ref]
    if len(after) == len(before):
        print(f"error: ref '{ref}' not found.", file=sys.stderr)
        sys.exit(1)
    removed = next(db for db in before if db["ref"] == ref)
    reg["databases"] = after
    save(reg)
    return removed


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "list"

    if cmd == "list":
        for db in list_databases():
            print(f"{db['ref']}\t{db['name']}\t{db['host']}:{db['port']}")

    elif cmd == "get":
        if len(sys.argv) < 3:
            print("Usage: registry.py get <ref>", file=sys.stderr); sys.exit(1)
        db = get_database(sys.argv[2])
        print(json.dumps(db, indent=2) if db else "not found")

    elif cmd == "add":
        if len(sys.argv) < 7:
            print("Usage: registry.py add <ref> <name> <host> <port> <database>", file=sys.stderr); sys.exit(1)
        ref, name, host, port, database = sys.argv[2:7]
        entry = add_database(ref, name, host, port, database)
        print(f"added: {entry['ref']}")

    elif cmd == "remove":
        if len(sys.argv) < 3:
            print("Usage: registry.py remove <ref>", file=sys.stderr); sys.exit(1)
        removed = remove_database(sys.argv[2])
        print(f"removed: {removed['ref']}")

    else:
        print(f"Unknown command: {cmd}. Try: list, get, add, remove", file=sys.stderr)
        sys.exit(1)
