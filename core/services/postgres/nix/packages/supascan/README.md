# Supascan - System Scanner and Validator

A comprehensive system auditing toolkit for generating and validating baseline specifications using [GOSS](https://github.com/goss-org/goss).

## Features

**One Unified CLI with Three Commands:**
- **`supascan genspec`** - Generate complete machine baseline (packages, services, configs, users, groups, mounts, kernel params)
- **`supascan validate`** - Validate machines against baseline specifications with critical/advisory categorization
- **`supascan split`** - Split a monolithic baseline into separate section files for easier auditing

**Use Cases:**
- Create baselines from "golden" machines
- Validate infrastructure configuration drift
- Continuous compliance monitoring
- Pre-release image validation in CI/CD pipelines

## Quick Start

### Generate a Machine Baseline
```bash
# Capture complete system state
sudo nix run .#supascan -- genspec baseline.yml

# With verbose output
sudo nix run .#supascan -- genspec --verbose baseline.yml

# Exclude dynamic/noisy directories with shallow scanning
sudo nix run .#supascan -- genspec --shallow-dirs /nix/store --shallow-dirs /data/pgdata baseline.yml
```

### Split Baseline into Sections
```bash
# Split into separate files (service.yml, user.yml, files-security.yml, etc.)
nix run .#supascan -- split baseline.yml

# Split to a specific output directory
nix run .#supascan -- split baseline.yml --output-dir /path/to/baselines
```

### Validate Against Baselines
```bash
# Validate system against baseline specs directory
sudo nix run .#supascan -- validate /path/to/baselines

# With verbose output showing all check details
sudo nix run .#supascan -- validate --verbose /path/to/baselines

# Using documentation format for readable output
sudo nix run .#supascan -- validate --format documentation /path/to/baselines
```

## Installation

### Using Nix Flake
```bash
# Run directly
nix run github:supabase/postgres#supascan -- --help

# Install to profile
nix profile install github:supabase/postgres#supascan
```

### Development Environment
```bash
git clone https://github.com/supabase/postgres
cd postgres
nix develop
```

This gives you access to:
- `supascan` CLI
- `goss` binary
- Development tools

## Usage

### supascan genspec

Generate a comprehensive baseline specification from a running machine.

```bash
# Basic usage - generates machine-baseline.yaml
sudo supascan genspec

# Custom output file
sudo supascan genspec my-baseline.yml

# JSON format
sudo supascan genspec --format json baseline.json

# Include optional scanners
sudo supascan genspec --include-ports --include-processes baseline.yml

# Shallow directory scanning (scan top-level only, skip deep recursion)
sudo supascan genspec --shallow-dirs /nix/store --shallow-depth 1 baseline.yml

# Verbose logging
sudo supascan genspec --verbose --log-format json baseline.yml
```

**Captures:**
- All installed packages (with versions)
- All systemd services (enabled/running state)
- All kernel parameters (sysctl values)
- File permissions and ownership
- All user accounts and groups
- Mount points and options
- Optionally: listening ports, running processes

**Options:**
| Flag | Description |
|------|-------------|
| `--format <yaml\|json>` | Output format (default: yaml) |
| `--config <file>` | Load exclusions from config file |
| `--include-dynamic` | Include dynamic kernel parameters |
| `--include-ports` | Include listening ports |
| `--include-processes` | Include running processes |
| `--shallow-dirs <path>` | Directories to scan with limited depth (repeatable) |
| `--shallow-depth <n>` | Depth for shallow dirs (1=top level only) |
| `--strict` | Fail on any access errors |
| `--verbose` | Enable structured logging |
| `--debug` | Enable debug logging |

### supascan split

Split a monolithic baseline file into separate section files for targeted auditing.

```bash
# Split baseline.yml in same directory
supascan split baseline.yml

# Split to specific output directory
supascan split baseline.yml --output-dir ./baselines
```

**Creates separate files:**
- `service.yml` - Systemd services
- `user.yml` - User accounts
- `group.yml` - Groups
- `mount.yml` - Mount points
- `package.yml` - Installed packages
- `kernel-param.yml` - Kernel parameters
- `files-security.yml` - Security-related files (fail2ban, nftables)
- `files-ssl.yml` - SSL certificates and keys
- `files-postgres-config.yml` - PostgreSQL configuration
- `files-postgres-data.yml` - PostgreSQL data directory
- `files-etc.yml` - General /etc files
- `files-systemd.yml` - Systemd unit files
- `files-usr.yml`, `files-usr-local.yml` - Application files
- And more...

### supascan validate

Validate the system against multiple baseline specification files with critical/advisory categorization.

```bash
# Basic validation
sudo supascan validate /path/to/baselines

# Verbose output
sudo supascan validate --verbose /path/to/baselines

# Different output formats
sudo supascan validate --format documentation /path/to/baselines
sudo supascan validate --format json /path/to/baselines

# Custom goss path
sudo supascan validate --goss /usr/local/bin/goss /path/to/baselines
```

**Validation Categories:**

*Critical specs (must pass):*
- `service.yml` - Service configuration
- `user.yml` - User accounts
- `group.yml` - Group memberships
- `mount.yml` - Mount points
- `package.yml` - Required packages
- `files-security.yml` - Security configurations
- `files-ssl.yml` - SSL/TLS files
- `files-postgres-config.yml` - Database configuration
- `files-postgres-data.yml` - Database data permissions

*Advisory specs (informational):*
- `kernel-param.yml` - Kernel parameters
- `files-etc.yml` - General configuration files
- `files-systemd.yml` - Systemd units
- `files-*.yml` - Other file categories

**Exit Codes:**
- `0` - All critical checks passed
- `1` - One or more critical checks failed

**Options:**
| Flag | Description |
|------|-------------|
| `--format <tap\|documentation\|json>` | Output format (default: tap) |
| `--goss <path>` | Path to goss binary (default: goss) |
| `--verbose` | Show detailed output for each spec |

## Workflow Examples

### Baseline-Driven Compliance

1. **Generate baseline from golden machine:**
```bash
ssh admin@golden-server
sudo supascan genspec baseline.yml
```

2. **Split into sections:**
```bash
supascan split baseline.yml --output-dir ./baselines
```

3. **Commit baselines to repo:**
```bash
git add baselines/
git commit -m "Add production baselines"
```

4. **Validate other machines:**
```bash
sudo supascan validate ./baselines
```

### CI/CD Image Validation

Add to your image build pipeline:

```bash
# In ansible playbook or build script
supascan validate /path/to/baselines

# Exit code 0 = pass, 1 = critical failure
```

Example output:
```
============================================================
CRITICAL CHECKS (must pass)
============================================================

  ✓ service: passed
  ✓ user: passed
  ✓ group: passed
  ✓ mount: passed
  ✓ package: passed
  ✓ files-security: passed
  ✓ files-ssl: passed
  ✓ files-postgres-config: passed
  ✓ files-postgres-data: passed

============================================================
ADVISORY CHECKS (informational)
============================================================

  ✓ kernel-param: passed
  ✓ files-etc: passed
  ✗ files-usr-local: FAILED
  ⊘ files-nix: skipped (file not found)

============================================================
SUMMARY
============================================================

Critical checks:
  Passed:  9
  Failed:  0
  Skipped: 0

Advisory checks:
  Passed:  2
  Failed:  1
  Skipped: 1

✓ Baseline validation PASSED
  All critical checks passed.
  Note: 1 advisory check(s) failed - review recommended.
```

## Configuration

### Exclusion Config File

Create a YAML config file to customize exclusions:

```yaml
# config.yaml
paths:
  - /custom/path/to/exclude/*
  - "*.log"

shallowDirs:
  - /nix/store
  - /data/pgdata

shallowDepth: 1

kernelParams:
  - kernel.random.uuid
  - fs.dentry-state

disabledScanners:
  - port
  - process
```

Use with:
```bash
sudo supascan genspec --config config.yaml baseline.yml
```

### Default Exclusions

The following are excluded by default to reduce noise:

**Paths:**
- Virtual filesystems: `/proc/*`, `/sys/*`, `/dev/*`, `/run/*`
- Temporary: `/tmp/*`, `/var/tmp/*`
- Caches: `/var/cache/*`, `*/.cache/*`
- Logs: `/var/log/*`
- Python bytecode: `*/__pycache__/*`, `*.pyc`
- Shell history: `*/.bash_history`, `*/.zsh_history`

**Shallow Directories:**
- `/nix/store` - Nix store (scan top-level only)
- `/data/pgdata` - PostgreSQL data
- `/opt/saltstack` - Salt installation
- `/usr/local/share`, `/usr/local/lib`

**Kernel Parameters:**
- Dynamic counters: `fs.dentry-state`, `fs.file-nr`, `kernel.random.*`
- RAM-dependent: `fs.epoll.max_user_watches`, `net.netfilter.*`

## Repository Structure

```
nix/packages/supascan/
├── cmd/supascan/
│   ├── main.go           # Root command
│   ├── genspec.go        # genspec subcommand
│   ├── validate.go       # validate subcommand
│   ├── split.go          # split subcommand
│   └── *_test.go         # Tests
├── internal/
│   ├── config/           # Configuration loading
│   ├── logger/           # Structured logging
│   ├── scanners/         # System scanners
│   ├── spec/             # Spec writing (YAML/JSON)
│   └── validator/        # Validation logic
├── go.mod
├── go.sum
└── README.md

audit-specs/
├── baselines/            # Committed baseline specs
│   ├── baseline.yml      # Full baseline
│   ├── service.yml       # Split sections...
│   └── ...
├── cis_level1_server.yaml
└── cis_level2_server.yaml
```

## Development

### Building

```bash
# Build with nix
nix build .#supascan

# Run tests
nix develop --command go test ./...
```

### Code Quality

```bash
# Format all files
nix fmt

# Run all checks
nix flake check
```

## Requirements

- Nix (with flakes enabled)
- Target systems: Linux (Ubuntu 20.04+), aarch64 or x86_64
- `sudo` access for scanning and validation (many checks require root)

## Credits

- Built with [GOSS](https://github.com/goss-org/goss) by Ahmed Elsabbahy
- CIS benchmarks from [Center for Internet Security](https://www.cisecurity.org/)
