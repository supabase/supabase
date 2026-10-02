# Docker Image Testing

This document describes how to test PostgreSQL Docker images against the pg_regress test suite.

## Overview

The `test-docker-image.sh` script builds a Docker image from one of the project's Dockerfiles and runs the existing `nix/tests/` test suite against it. This validates that Docker images work correctly before deployment.

## Quick Start

```bash
# Test PostgreSQL 17 image
./test-docker-image.sh Dockerfile-17

# Test PostgreSQL 15 image
./test-docker-image.sh Dockerfile-15

# Test OrioleDB 17 image
./test-docker-image.sh Dockerfile-orioledb-17
```

## Requirements

- Docker
- Nix (provides psql and pg_regress from the flake)

## Usage

```
Usage: ./test-docker-image.sh [OPTIONS] DOCKERFILE

Test a PostgreSQL Docker image against the pg_regress test suite.

Arguments:
  DOCKERFILE    The Dockerfile to build and test (e.g., Dockerfile-17)

Options:
  -h, --help    Show this help message
  --no-build    Skip building the image (use existing)
  --keep        Keep the container running after tests (for debugging)
```

### Examples

```bash
# Build and test
./test-docker-image.sh Dockerfile-17

# Test without rebuilding (faster iteration)
./test-docker-image.sh --no-build Dockerfile-17

# Keep container running for debugging
./test-docker-image.sh --keep Dockerfile-17
# Then connect with:
# psql -h localhost -p 5435 -U supabase_admin postgres
```

## How It Works

1. **Build** - Builds Docker image from the specified Dockerfile
2. **Start** - Runs container with PostgreSQL exposed on a test port
3. **Wait** - Waits for PostgreSQL to be ready (pg_isready)
4. **HTTP Mock** - Starts the HTTP mock server inside the container for `http` extension tests
5. **Setup** - Runs `prime.sql` to enable all extensions, creates `test_config` table
6. **Patch** - Copies test files to temp dir, patches expected outputs for Docker-specific differences
7. **Test** - Runs pg_regress with version-filtered test files
8. **Compare** - Checks output against patched expected files
9. **Report** - Shows pass/fail, prints diffs on failure
10. **Cleanup** - Removes container (unless `--keep`)

## Version Mapping

| Dockerfile | Version | Test Port | Test Filter | Tests |
|------------|---------|-----------|-------------|-------|
| Dockerfile-15 | 15 | 5436 | `z_15_*.sql` + common | 53 |
| Dockerfile-17 | 17 | 5435 | `z_17_*.sql` + common | 49 |
| Dockerfile-orioledb-17 | orioledb-17 | 5437 | `z_orioledb-17_*.sql` + common | 47 |

## Test Filtering

Tests in `nix/tests/sql/` are filtered by PostgreSQL version:

- Files without `z_` prefix run for **all versions**
- Files starting with `z_15_` run only for PostgreSQL 15
- Files starting with `z_17_` run only for PostgreSQL 17
- Files starting with `z_orioledb-17_` run only for OrioleDB 17

## CI Integration

### GitHub Actions

```yaml
jobs:
  test-docker:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        dockerfile:
          - Dockerfile-15
          - Dockerfile-17
          - Dockerfile-orioledb-17
    steps:
      - uses: actions/checkout@v4
      - uses: cachix/install-nix-action@v24
      - name: Test Docker image
        run: ./test-docker-image.sh ${{ matrix.dockerfile }}
```

## Debugging Failed Tests

When tests fail, the script outputs `regression.diffs` showing the differences between expected and actual output.

To investigate further:

```bash
# Run with --keep to preserve container
./test-docker-image.sh --keep Dockerfile-17

# Connect to the running database
psql -h localhost -p 5435 -U supabase_admin postgres

# Run individual test manually
psql -h localhost -p 5435 -U supabase_admin postgres -f nix/tests/sql/pgroonga.sql
```

## Relationship to Nix Checks

This script complements `nix flake check` which tests the Nix-built PostgreSQL packages directly. The Docker tests validate that:

1. Docker image builds correctly
2. Extensions are properly installed in the container
3. Configuration files are correctly applied
4. The containerized PostgreSQL behaves the same as the Nix-built version

## Known Differences (Auto-Patched)

The script automatically patches expected outputs at runtime to handle Docker-specific differences:

| Difference | Affected Tests | Cause |
|------------|----------------|-------|
| `$user` → `\$user` in search_path | pgmq, vault, roles | Docker image configuration escapes `$` in search_path |

These patches are applied to a temporary copy of the test files - the original files are never modified.

### OrioleDB-Specific Test Files

For tests that produce different output under OrioleDB (due to the orioledb extension being loaded or different storage behavior), create OrioleDB-specific versions:

- `nix/tests/sql/z_orioledb-17_<testname>.sql` - OrioleDB version of the test
- `nix/tests/expected/z_orioledb-17_<testname>.out` - Expected output for OrioleDB

When an OrioleDB variant exists, the common test is automatically skipped for OrioleDB runs. This approach is used by both the Docker test script and Nix flake checks.

## Adding New Tests

1. Add SQL file to `nix/tests/sql/`
2. Add expected output to `nix/tests/expected/`
3. For version-specific tests, prefix with `z_15_`, `z_17_`, or `z_orioledb-17_`

See existing tests for examples.
