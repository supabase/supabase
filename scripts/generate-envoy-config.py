#!/usr/bin/env python3
"""
Generate Envoy cluster and listener configs for multi-database Supabase.

Usage:
  python3 scripts/generate-envoy-config.py --cds > docker/volumes/api/envoy/cds.yaml
  python3 scripts/generate-envoy-config.py --lds > docker/volumes/api/envoy/lds.generated.yaml

Environment variables:
  DATABASE_REGISTRY_PATH  Path to databases.json (default: docker/volumes/registry/databases.json)
"""

import json
import yaml
import os
import sys
import argparse

parser = argparse.ArgumentParser(description="Generate Envoy config for multi-database Supabase")
parser.add_argument("--cds", action="store_true", help="Generate cluster discovery service (CDS) config")
parser.add_argument("--lds", action="store_true", help="Generate listener/route snippet for per-project routes")
args = parser.parse_args()

if not args.cds and not args.lds:
    parser.print_help()
    sys.exit(1)

registry_path = os.environ.get(
    "DATABASE_REGISTRY_PATH",
    "docker/volumes/registry/databases.json"
)

with open(registry_path) as f:
    registry = json.load(f)

databases = registry["databases"]


def make_cluster(name: str, address: str, port: int) -> dict:
    """Build an Envoy Cluster resource dict."""
    return {
        "@type": "type.googleapis.com/envoy.config.cluster.v3.Cluster",
        "name": name,
        "type": "STRICT_DNS",
        "connect_timeout": "15s",
        "dns_lookup_family": "V4_ONLY",
        "lb_policy": "ROUND_ROBIN",
        "load_assignment": {
            "cluster_name": name,
            "endpoints": [{
                "lb_endpoints": [{
                    "endpoint": {
                        "address": {
                            "socket_address": {
                                "address": address,
                                "port_value": port
                            }
                        }
                    }
                }]
            }]
        }
    }


def make_auth_route(ref: str) -> dict:
    """Create a header-matched route for a specific project's auth service (GoTrue)."""
    return {
        "match": {
            "prefix": "/auth/v1/",
            "headers": [{
                "name": "X-Project-Ref",
                "string_match": {"exact": ref}
            }]
        },
        "route": {
            "cluster": f"auth-{ref}",
            "prefix_rewrite": "/"
        }
    }


def make_rest_route(ref: str) -> dict:
    """Create a header-matched route for a specific project's PostgREST service."""
    return {
        "match": {
            "prefix": "/rest/v1/",
            "headers": [{
                "name": "X-Project-Ref",
                "string_match": {"exact": ref}
            }]
        },
        "route": {
            "cluster": f"rest-{ref}",
            "prefix_rewrite": "/"
        }
    }


if args.cds:
    # Load existing CDS as base to preserve default clusters
    cds_base_path = os.environ.get(
        "ENVOY_CDS_BASE_PATH",
        "docker/volumes/api/envoy/cds.yaml"
    )
    with open(cds_base_path) as f:
        cds = yaml.safe_load(f)

    # Collect names of existing clusters to avoid duplicates
    existing_names = {r["name"] for r in cds.get("resources", []) if isinstance(r, dict)}

    # Add per-database clusters for each non-default database
    for db in databases:
        ref = db["ref"]
        if ref == "default":
            continue  # default uses the existing auth/rest clusters

        auth_cluster_name = f"auth-{ref}"
        rest_cluster_name = f"rest-{ref}"

        if auth_cluster_name not in existing_names:
            cds["resources"].append(make_cluster(
                auth_cluster_name,
                f"supabase-auth-{ref}",
                9999
            ))

        if rest_cluster_name not in existing_names:
            cds["resources"].append(make_cluster(
                rest_cluster_name,
                f"supabase-rest-{ref}",
                3000
            ))

    print(yaml.dump(cds, default_flow_style=False, sort_keys=False))


if args.lds:
    # Generate per-project route snippets to be inserted BEFORE default routes in lds.yaml
    extra_routes = []
    for db in databases:
        ref = db["ref"]
        if ref == "default":
            continue
        extra_routes.append(make_auth_route(ref))
        extra_routes.append(make_rest_route(ref))

    print("# Per-database routes - insert BEFORE the default /auth/v1/ and /rest/v1/ routes")
    print("# in lds.template.yaml under virtual_hosts[0].routes")
    print("#")
    print("# Envoy matches routes top-to-bottom; header-specific routes MUST come first.")
    print()
    print(yaml.dump({"routes": extra_routes}, default_flow_style=False, sort_keys=False))