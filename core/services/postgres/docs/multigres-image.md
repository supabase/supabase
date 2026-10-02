# Multigres Docker Image

The multigres image is a single multi-stage `Dockerfile-multigres` that produces two
PostgreSQL 17 variants from one build file:

| Target | Tag | Port (tests) | Notes |
|--------|-----|-------------|-------|
| `variant-17` | `multigres-17` | 5438 | Supabase PostgreSQL 17 |
| `variant-orioledb-17` | `multigres-orioledb-17` | 5439 | Supabase OrioleDB 17 storage engine |

Both variants share a common Alpine-based `base` stage that installs runtime
dependencies, copies config files, and runs database migrations.

## Differences from standard images

| | Standard images (`Dockerfile-17`, `Dockerfile-orioledb-17`) | Multigres |
|---|---|---|
| Entrypoint | `docker-entrypoint.sh` (auto-starts postgres + runs migrations) | `tail -f /dev/null` (postgres started manually) |
| Config source | `/etc/postgresql/postgresql.conf` | Same |
| Data directory | `/var/lib/postgresql/data` | Same |
| pgsodium | Enabled | **Not enabled** (extension not created) |
| supautils | Enabled | Enabled |
| supabase_vault | Enabled | Enabled |
| pgsodium_getkey.sh | Present | Present (required by vault at startup) |

### Why `tail -f /dev/null`?

Multigres images are designed for environments that manage PostgreSQL startup
externally (e.g. Kubernetes init containers, orchestration layers). The test
harness and any deployment tooling is responsible for running `initdb`,
starting the server, and running migrations.

### pgsodium and vault

`supabase_vault` is loaded via `shared_preload_libraries` and requires the
pgsodium getkey script at startup — even when the `pgsodium` SQL extension is
not installed. The getkey script is present at
`/usr/lib/postgresql/bin/pgsodium_getkey.sh` in both variants.

The `pgsodium` SQL extension is intentionally **not** created in multigres
images. `supabase_vault` works independently using the same key derivation
infrastructure.

### OrioleDB variant extras

- `orioledb` added to `shared_preload_libraries`
- `default_table_access_method = 'orioledb'`
- Rewind configured: 1200s window, 100k transactions, 10MB buffer
- `CREATE EXTENSION orioledb` run before migrations

## Building

```bash
# Build vanilla PostgreSQL 17 variant
docker build -f Dockerfile-multigres --target variant-17 -t multigres-17 .

# Build OrioleDB 17 variant
docker build -f Dockerfile-multigres --target variant-orioledb-17 -t multigres-orioledb-17 .
```

Both targets can be built in parallel since they share only the `base` stage
(not the Nix builder stages).

## Running tests

Tests use the same `nix run .#docker-image-test` harness as other images but
require `--target` to specify which variant.

### Build image then test

```bash
# variant-17
docker build -f Dockerfile-multigres --target variant-17 -t pg-docker-test:multigres-17 . && \
nix run .#docker-image-test -- --no-build --target variant-17 Dockerfile-multigres

# variant-orioledb-17
docker build -f Dockerfile-multigres --target variant-orioledb-17 -t pg-docker-test:multigres-orioledb-17 . && \
nix run .#docker-image-test -- --no-build --target variant-orioledb-17 Dockerfile-multigres
```

### Install nix

## Install Nix (Fresh Installation)

We'll use the official Nix installer with a custom configuration that includes our build caches and settings. This works on many platforms, including **aarch64 Linux**, **x86_64 Linux**, and **macOS**.

### Step 1: Create nix.conf.extra

First, create a file named `nix.conf.extra` with the following content:

```
experimental-features = nix-command flakes
extra-substituters = https://nix-postgres-artifacts.s3.amazonaws.com
extra-trusted-public-keys = nix-postgres-artifacts:dGZlQOvKcNEjvT7QEAJbcV6b6uk7VF/hWMjhYleiaLI=
 ```

> [!CAUTION]
> DO NOT add anyone to `trusted-users` in `/etc/nix/nix.conf` as it [grants root without password](https://nix.dev/manual/nix/stable/command-ref/conf-file.html#conf-trusted-users). Instead, add the binary cache to `extra-substituters` and `extra-trusted-public-keys`.

Read about the binary cache in [/nix/docs/binary-cache.md](/nix/docs/binary-cache.md).

### Step 2: Install Nix 2.34.6

Run the following command to install Nix 2.34.6 (the version used in CI) with the custom configuration:

```bash
curl -L https://releases.nixos.org/nix/nix-2.34.6/install | sh -s -- --daemon --yes --nix-extra-conf-file ./nix.conf.extra
```

This will install Nix with our build caches pre-configured, which should eliminate substituter-related errors.

After you do this, **you must log in and log back out of your desktop
environment** (or restart your terminal session) to get a new login session. This is so that your shell can have
the Nix tools installed on `$PATH` and so that your user shell can see the
extra settings.

You should now be able to do something like the following; try running these
same commands on your machine:

```
$ nix --version
nix (Nix) 2.34.6
```


### Test only (image already built)

```bash
nix run .#docker-image-test -- --no-build --target variant-17 Dockerfile-multigres
nix run .#docker-image-test -- --no-build --target variant-orioledb-17 Dockerfile-multigres
```

### What the test harness does for multigres

Because multigres uses `tail -f /dev/null` as its entrypoint, the test harness
performs the setup that `docker-entrypoint.sh` normally handles:

1. **`initdb`** — initialises the cluster at `/var/lib/postgresql/data` with
   `--username=supabase_admin` and sets the superuser password via `--pwfile`
2. **`pg_ctl start`** — starts postgres using `/etc/postgresql/postgresql.conf`
   (which has `data_directory = '/var/lib/postgresql/data'`)
3. **`migrate.sh`** — runs schema migrations from `/docker-entrypoint-initdb.d/`

## Test structure

Multigres uses a mix of shared tests and multigres-specific override tests.

### Skipped tests

| Test | Reason |
|------|--------|
| `pgsodium` | Extension not installed |
| `vault` | Replaced by `z_multigres-*_vault` variants |

### Multigres-specific test files (`z_multigres-17_*`)

These override the equivalent shared test when present, allowing multigres
results to diverge from the standard expected output (e.g. no pgsodium roles):

| File | Overrides | Notes |
|------|-----------|-------|
| `z_multigres-17_evtrigs` | `evtrigs` | No `pgsodium_trg_mask_update` trigger |
| `z_multigres-17_ext_interface` | — | multigres-17 extension set |
| `z_multigres-17_pg_stat_monitor` | — | |
| `z_multigres-17_pgvector` | — | |
| `z_multigres-17_roles` | `roles` | No pgsodium roles/permissions |
| `z_multigres-17_rum` | — | |
| `z_multigres-17_security` | `security` | No pgsodium security definer functions |
| `z_multigres-17_vault` | `vault` | vault privileges for multigres |

### OrioleDB variant test files (`z_multigres-orioledb-17_*`)

| File | Overrides | Notes |
|------|-----------|-------|
| `z_multigres-orioledb-17_docs-*` | `docs-*` | OrioleDB table access method |
| `z_multigres-orioledb-17_evtrigs` | `evtrigs` | No pgsodium trigger |
| `z_multigres-orioledb-17_ext_interface` | — | orioledb extension set |
| `z_multigres-orioledb-17_extensions_schema` | — | |
| `z_multigres-orioledb-17_pg_stat_monitor` | — | |
| `z_multigres-orioledb-17_pgroonga` | — | |
| `z_multigres-orioledb-17_pgvector` | — | |
| `z_multigres-orioledb-17_roles` | `roles` | No pgsodium roles/permissions |
| `z_multigres-orioledb-17_security` | `security` | No pgsodium security definer functions |
| `z_multigres-orioledb-17_vault` | `vault` | vault privileges for multigres |
| `z_multigres-orioledb-17_verify_orioledb` | — | OrioleDB-specific assertions |

### Updating expected output

When test output legitimately changes (extension updates, migration changes),
regenerate the expected files:

```bash
# Run test — it will fail and preserve output at /tmp/tmp.<id>/
nix run .#docker-image-test -- --no-build --target variant-17 Dockerfile-multigres

# Copy all multigres-17 expected files
cp /tmp/tmp.<id>/regression_output/results/z_multigres-17_*.out nix/tests/expected/

# Same for orioledb variant
nix run .#docker-image-test -- --no-build --target variant-orioledb-17 Dockerfile-multigres
cp /tmp/tmp.<id>/regression_output/results/z_multigres-orioledb-17_*.out nix/tests/expected/
```

> **Note:** Do not copy shared test files (`vault.out`, `roles.out`,
> `pgmq.out`, `http.out`) from multigres test runs back to `nix/tests/expected/`.
> Those files are patched at runtime by the test harness and will break other
> image tests if overwritten with patched content.


## Updating multigres

1. run `nix flake update multigres` from root of repo (it should only change `flake.lock` file)
2. `git add flake.lock`
3. `nix build .#pgctld` and update `nix/packages/pgctld.nix`  `vendorHash` with returned value
   example `vendorHash = "sha256-cqSd6Dv0WYOVwg7AE1tZPh9uzsjDG32gF6eJzARsHo8=";`
4. `git add nix/packages/pgctld.nix`
5. run the tests locally with 
  a. `nix run .#docker-image-test -- --target variant-17 Dockerfile-multigres`
  b. `nix run .#docker-image-test -- --target variant-orioledb-17 Dockerfile-multigres`
6. release the images by incrementing these values in `ansible/vars.yaml` by 1 

# Full version strings for each major version
```
postgres_release:
  postgresorioledb-17: "17.6.0.054-orioledb"
  postgres17: "17.6.1.097"
  postgres15: "15.14.1.097"     
```
Then you can push the changes if the images pass those tests
