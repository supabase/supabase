# Nix Directory Structure

This document explains the Nix structure used in this repository. The project uses [flake-parts](https://flake.parts/) to split a `flake.nix` into specialized, maintainable modules.

!!! tip "Deep Dive"
    For a comprehensive explanation of how flake-parts works in this repository, including module scopes, evaluation order, and common patterns, see:

    - **[Flake-Parts Architecture](./flake-parts-architecture.md)** - Module structure and patterns
    - **[Flake-Parts and nixpkgs lib](./flake-parts-nixpkgs-lib.md)** - nixpkgs lib foundations

The root `flake.nix` serves only as an entry point that references specialized modules in the `nix/` directory:

```
├── flake.nix                  # Root flake file only referencing modules
nix/
 ├── apps.nix                 # Application definitions
 ├── checks.nix               # Build checks and tests
 ├── config.nix               # Global configuration
 ├── devShells.nix            # Development environment shell
 ├── fmt.nix                  # Code formatting configuration
 ├── hooks.nix                # Git hooks and pre-commit
 ├── ext/                     # PostgreSQL extensions
 ├── overlays/                # Nixpkgs overlays
 ├── packages/                # Custom packages
 └── postgresql/              # PostgreSQL packages
```

## Module Descriptions

### Root Files

#### `flake.nix`

The main flake file that:

- Declares inputs (nixpkgs, flake-parts, etc.)
- Sets up the systems to support (x86_64-linux, aarch64-linux, aarch64-darwin)
- Imports all module files using flake-parts

#### `flake.lock`

Lockfile containing exact versions of all flake inputs.

### Core Configuration Modules

#### `nix/config.nix`

Global configuration and constants used throughout the flake:

- PostgreSQL default ports and users
- System-wide package configurations
- Shared constants and variables

#### `nix/nixpkgs.nix`

Nixpkgs configuration:

- System-specific package imports
- Overlay applications
- Package configuration (allow unfree packages, etc.)

### Development Environment

#### `nix/devShells.nix`

Development shell configurations:

- Default development environment
- Tool dependencies for development
- Environment variables and setup

#### `nix/fmt.nix`

Code formatting configuration using [treefmt](https://github.com/numtide/treefmt/):

- nixfmt-rfc-style for Nix code formatting
- deadnix for removing unused nix code

More details in [Code formatter](./nix-formatter.md).

#### `nix/hooks.nix`

Git hooks and pre-commit configuration:

- Integration with [git-hooks.nix](https://github.com/cachix/git-hooks.nix)
- Automatic formatting on commit
- Code quality checks

More details in [Pre-coommit hooks](./pre-commit-hooks.md).

### Applications and Packages

#### `nix/apps.nix`

Application definitions accessible via `nix run`:

- Development tools and scripts
- Build and deployment utilities
- Testing and validation tools

#### `nix/packages/`

Directory containing custom package definitions such as:

  - `default.nix` - Main package exports and basePackages
  - `start-client.nix` - PostgreSQL client tools
  - `start-replica.nix` - Replication tools
  - `migrate-tool.nix` - Migration utilities
  - `dbmate-tool.nix` - Database migration tool
  - `postgres.nix` - Postgres extension registry and ourExtensions list

#### `nix/checks.nix`

Build checks and validation:

- Package build validation
- Integration tests
- Code quality checks
- Ensures all Postgres packages build correctly

### PostgreSQL-Specific

#### `nix/postgresql/`

PostgreSQL package definitions:

- `default.nix` - Main PostgreSQL package exports
- `generic.nix` - Generic PostgreSQL build functions
- `src.nix` - PostgreSQL source package generation
- `patches/` - PostgreSQL-specific patches

#### `nix/ext/`

PostgreSQL extensions:

- Individual `.nix` files - Extension definitions like:
  - `pgvector.nix` - Vector similarity search
  - `pgsodium.nix` - Encryption extension
  - `pg_graphql.nix` - GraphQL support
  - `timescaledb.nix` - Time-series database
  - And 30+ other extensions

### System Customization

#### `nix/overlays/`

Nixpkgs overlays for package customization:

- `default.nix` - Main overlay that imports all others
- `cargo-pgrx-0-11-3.nix` - PGRX toolchain overlay
- `psql_16-oriole.nix` - OrioleDB PostgreSQL variant

#### `nix/cargo-pgrx/`

Rust-based PostgreSQL extension building:

- `default.nix` - cargo-pgrx package definitions
- `buildPgrxExtension.nix` - Builder for Rust extensions

### Testing

#### `nix/tests/`

Test suites and expected outputs:

- `sql/` - SQL test files
- `expected/` - Expected test outputs
- `migrations/` - Migration test data
- `smoke/` - Smoke tests for quick validation
