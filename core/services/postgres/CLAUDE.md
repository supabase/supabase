# CLAUDE.md

Guidance for Claude Code sessions working in this repo.

## Repo identity — do not confuse with the upstream mirror

This is **`supabase/postgres`**: Supabase's own build/packaging repo for its
PostgreSQL distribution. It does **not** contain a fork of PostgreSQL's C
source.

## What this repo is

A batteries-included PostgreSQL distribution: unmodified upstream PostgreSQL
(15, 17, and an `orioledb-17` fork) plus a large curated set of pre-built
extensions (see the extension tables in `README.md`). It produces three
release artifacts from one source tree:

1. **Docker images** (`Dockerfile-15`, `Dockerfile-17`, `Dockerfile-supabase`,
   `Dockerfile-multigres`) — used by local dev / the Supabase CLI.
2. **AWS AMIs** — the production Supabase-hosted Postgres image, built via
   Nix + Packer + Ansible.
3. **Nix packages** — `nix build .#psql_15.bin` etc., the underlying build
   system both other artifacts consume.

The project is mid-migration from a pure Dockerfile-based extension build
(what `CONTRIBUTING.md` still documents) to a Nix-based one (what `README.md`
and `nix/docs/` describe as current). When the two disagree, trust `nix/`
and `nix/docs/` — `CONTRIBUTING.md`'s Dockerfile-stage workflow is legacy for
extensions not yet ported.

## Directory structure

| Path | Purpose |
|---|---|
| `nix/` | Core build system (flake-parts modules). `nix/postgresql/` = PG version configs/patches; `nix/ext/` = one file per extension package; `nix/config.nix` = pinned PG versions/hashes per major (source of truth for "what version are we on"); `nix/tests/` = pg_regress + smoke + migration NixOS tests; `nix/docs/` = the real developer docs (start here, not README) |
| `ansible/` | Config management for the production AMI. `ansible/playbook.yml` = main playbook (Postgres/PostgREST/pgbouncer/Auth); `ansible/vars.yml` = **source of truth for AMI version tracking** (`postgres_release`, Docker release matrix); `ansible/files/postgresql_config/postgresql.conf.j2` = the actual GUC defaults shipped to customers |
| `migrations/db/` | SQL migrations and `init-scripts/` (what every new project's schema starts with — default-enabled extensions, roles) |
| `migrations/tests/extensions/` | pgTAP tests, one per extension, run via `pg_prove` against a Nix-built Postgres as part of `nix flake check` (`nix/checks.nix`) — not against a Docker image |
| `docker/`, `Dockerfile-*` | Container image definitions (`Dockerfile-supabase` is the version-parameterized base; `Dockerfile-multigres` layers `pgctld` + `pgbackrest` on top) |
| `ebssurrogate/`, `*.pkr.hcl` | Packer/EBS-surrogate AMI build pipeline |
| `testinfra/` | pytest suite (`test_ami_nix.py`) that runs against a live AMI/instance |
| `audit-specs/` | CIS-benchmark-style compliance specs run against built images |
| `docs/plans/` | Design docs for in-flight features (profiler, pgbackrest, etc.) |
| `.claude/skills/pg-security-release-analysis/` | Skill for triaging upstream PG quarterly security releases into a CVE/impact catalog — see below |

## Building and testing

Exact commands verified against `nix/docs/build-postgres.md`,
`nix/docs/development-workflow.md`, and `CONTRIBUTING.md`. Read `nix/docs/README.md`
first — it's the doc index and points to the specific runbook you need
(adding a package, updating an extension, testing migrations, new major PG
version, etc.) rather than duplicating them here.

```bash
# Build a full PG install (binaries + all extensions) locally via Nix
nix build .#psql_15.bin      # or psql_17, psql_orioledb-17

# Full flake check (nix eval + pg_regress + migration tests)
nix flake check -L
nix build .#checks.aarch64-darwin.psql_17 -L   # one target/platform only

# Docker images
docker build -f Dockerfile-15 -t supabase-postgres:15 .
docker build -f Dockerfile-supabase --build-arg PG_VERSION=17 -t supabase-postgres:17 .
docker build -f Dockerfile-multigres --build-arg SUPABASE_IMAGE=supabase-postgres:17 -t multigres:17 .

# Remote build/cache + AMI build + testinfra (needs aws-vault; see
# nix/docs/development-workflow.md for the full loop)
nix run .#trigger-nix-build
aws-vault exec <profile> -- nix run .#build-test-ami 17
nix run .#run-testinfra -- --aws-vault-profile <profile> --ami-name <ami-name>
```

Formatting/lint is `treefmt` (nixfmt + deadnix), wired as a git-hooks.nix
pre-commit hook when using `nix develop`/direnv; also enforced in CI, so
`nix flake check` catches format drift even without the hook installed.

## Non-obvious conventions and gotchas

- **Version pinning**: `nix/config.nix` pins the exact upstream PG version +
  source hash per major (`supabase.supportedPostgresVersions`). `ansible/vars.yml`
  (`postgres_release`) separately pins the *packaged* version string used for
  Docker/AMI tags — the two numbers look similar but serve different layers
  (Nix build input vs. release artifact tag); update both when bumping a PG
  minor.
- **Adding a new extension**: two documented paths depending on era —
  `nix/docs/adding-new-package.md` (current, Nix-based: one file in `nix/ext/`)
  vs. `CONTRIBUTING.md` (legacy, Dockerfile multi-stage build + `checkinstall`
  into a `.deb`, then copied into the `extensions` stage). Check whether the
  extension already has sibling packages under `nix/ext/` before following
  the Dockerfile path.
- **orioledb-17 is a separate PG fork**, not just another extension —
  security/behavior analysis needs to check whether a finding applies to
  vanilla 17, orioledb-17, or both.
- **Multi-version extensions**: some extensions (e.g. `pg_repack`) ship
  multiple versions side-by-side in the same install (`pg_repack-1.4.8`,
  `pg_repack-1.5.2`, ...) with `switch_<ext>_version` wrapper scripts to pick
  one at runtime — don't assume one binary name per extension.
- **`shared_preload_libraries`** (every project's postmaster preloads these)
  and **default-enabled extensions** (every project's initial schema) are two
  different, smaller lists than "everything in `nix/ext/`" — see
  `ansible/files/postgresql_config/postgresql.conf.j2` and
  `migrations/db/init-scripts/00000000000000-initial-schema.sql` respectively
  before assuming a change affects every customer project.
- **`.claude/skills/pg-security-release-analysis/`**: run this when triaging a
  new upstream PG quarterly security release. It has its own gotchas baked
  in (e.g. `git log --grep` doesn't tell you what version a fix first landed
  in — use `git tag --contains`; CVE severity in commit messages can diverge
  from postgresql.org's canonical security page) and a Supabase-specific
  "surface map" (which roles, extensions, and services — wal-g, PostgREST,
  Realtime, pgbouncer — are affected by which class of upstream change).
- Docs inside `nix/docs/` have previously gone stale relative to actual repo
  structure (see commit `2678fc8c docs: fix stale docs`) — if a doc and the
  actual `nix/` layout disagree, trust the code.
