# Machine Baselines

This directory contains captured baselines from real machines.

## Generating a Baseline

On your target machine:
```bash
sudo nix run github:supabase/ubuntu-cis-audit#cis-generate-spec -- baseline.yaml
```

## Naming Convention

Use descriptive names that identify the machine type or environment:
- `production-db-baseline.yaml` - Production database server
- `staging-api-baseline.yaml` - Staging API server
- `postgres-baseline.yaml` - Standard PostgreSQL server config

## Using Baselines

Copy your baseline to this directory and commit to git. Then use GOSS to audit other machines:

```bash
# On target machine
goss --gossfile audit-specs/baselines/production-db-baseline.yaml validate
```

## Baseline Sources

Document where each baseline came from:

- `postgres-baseline.yaml` - Generated from db-pdnxwzxvlrfwogpyaltm on 2025-11-22
- `production-baseline.yaml` - Generated from prod-server-001 on 2025-11-20
