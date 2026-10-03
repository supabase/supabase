# Flake-Parts Architecture

This document explains how this repository uses [flake-parts](https://flake.parts/) to organize its Nix flake into maintainable, composable modules.

!!! info "Deep Dive into nixpkgs lib"
    For a detailed explanation of how flake-parts leverages nixpkgs lib functions and the module system, see **[Flake-Parts and nixpkgs lib](./flake-parts-nixpkgs-lib.md)**.

## Overview

Flake-parts is a module system for Nix flakes that allows splitting a monolithic `flake.nix` into specialized modules. Instead of one large file with all outputs, we have multiple focused modules that each handle a specific concern.

## Why Flake-Parts?

Traditional flakes can become unwieldy as they grow:

```nix
{
  outputs = { nixpkgs, ... }: {
    packages.x86_64-linux = { ... };
    packages.aarch64-linux = { ... };
    packages.aarch64-darwin = { ... };
    devShells.x86_64-linux = { ... };
    devShells.aarch64-linux = { ... };
    # ... hundreds of lines of repetitive code
  };
}
```

Flake-parts solves this by:

1. **Per-system evaluation**: Write code once, evaluate it for each system automatically
2. **Module composition**: Split concerns into separate files
3. **Type safety**: Define typed configuration options
4. **Module system**: Import third-party modules (treefmt, git-hooks, etc.)

## Entry Point

The root `flake.nix` is minimal and delegates to modules:

```nix
{
  outputs = { flake-utils, ... }@inputs:
    inputs.flake-parts.lib.mkFlake { inherit inputs; } (_: {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
      ];
      imports = [
        nix/apps.nix
        nix/checks.nix
        nix/config.nix
        nix/devShells.nix
        nix/fmt.nix
        nix/hooks.nix
        nix/nixpkgs.nix
        nix/packages
        nix/overlays
      ];
    });
}
```

**Key function**: `mkFlake` accepts inputs and a configuration. Each imported module can define outputs.

## Module Scopes

Flake-parts modules operate at two scopes:

### perSystem Scope

Defines outputs for each system (x86_64-linux, aarch64-darwin, etc.):

```nix
{ ... }:
{
  perSystem = { self', pkgs, system, lib, config, inputs', ... }:
  {
    # System-specific outputs
    packages = { ... };
    apps = { ... };
    devShells = { ... };
    checks = { ... };
  };
}
```

**Available arguments**:

| Argument | Description |
|----------|-------------|
| `self'` | Outputs from the current system (e.g., `self'.packages.foo`) |
| `pkgs` | nixpkgs for current system |
| `system` | Current system string (e.g., `"x86_64-linux"`) |
| `lib` | nixpkgs library functions |
| `config` | Module configuration (from `config.nix`) |
| `inputs'` | Flake inputs for current system |

### Flake Scope

Defines system-independent, flake-wide configuration:

```nix
{ lib, ... }:
{
  flake = {
    options = { ... };      # Module options
    config = { ... };       # Configuration values
    overlays = { ... };     # System-independent overlays
  };
}
```

## Module Breakdown

### Infrastructure Modules

#### nix/nixpkgs.nix

**Purpose**: Configure the `pkgs` argument for all perSystem modules.

```nix
{ self, inputs, ... }:
{
  perSystem = { system, ... }: {
    _module.args.pkgs = import inputs.nixpkgs {
      inherit system;
      config.allowUnfree = true;
      permittedInsecurePackages = [ "v8-9.7.106.18" ];
      overlays = [
        (import inputs.rust-overlay)
        self.overlays.default
      ];
    };
  };
}
```

**Critical role**: Instantiates nixpkgs once per system with:
- Unfree packages enabled
- Custom overlays applied
- System-specific configuration

This runs first to provide `pkgs` to all other modules.

#### nix/config.nix

**Purpose**: Define typed, flake-wide configuration options.

Uses the NixOS module system for type-safe configuration:

```nix
{ lib, ... }:
let
  postgresqlDefaults = lib.types.submodule {
    options = {
      port = lib.mkOption {
        type = lib.types.str;
        default = "5435";
      };
      host = lib.mkOption {
        type = lib.types.str;
        default = "localhost";
      };
      superuser = lib.mkOption {
        type = lib.types.str;
        default = "supabase_admin";
      };
    };
  };
in
{
  flake = {
    options = {
      supabase = lib.mkOption { type = postgresqlDefaults; };
    };
    config.supabase = {
      defaults = { };
      supportedPostgresVersions = {
        postgres = {
          "15" = { version = "15.14"; hash = "sha256-..."; };
          "17" = { version = "17.6"; hash = "sha256-..."; };
        };
      };
    };
  };
}
```

**Access pattern**: Other modules access via `self.supabase.defaults`.

### Output Modules

#### nix/packages/default.nix

**Purpose**: Combine all packages from various sources.

```nix
{ self, inputs, ... }:
{
  perSystem = { pkgs, self', lib, ... }:
  {
    packages = (
      {
        # Individual hand-written packages
        dbmate-tool = pkgs.callPackage ./dbmate-tool.nix {
          inherit (self.supabase) defaults;
        };
        start-server = pkgs-lib.makePostgresDevSetup { ... };
      }
      // lib.filterAttrs (...) (
        # Generated PostgreSQL packages
        pkgs.callPackage ../postgresql/default.nix { ... }
      )
    );
  };
}
```

**Pattern**: Uses `//` (attribute set merge) to combine:
- Hand-written utility packages
- Auto-generated PostgreSQL packages with extensions

#### nix/packages/postgres.nix

**Purpose**: Generate PostgreSQL packages with extensions.

Demonstrates advanced functional composition:

```nix
{ inputs, ... }:
{
  perSystem = { pkgs, ... }:
  let
    # List of extension definitions
    ourExtensions = [
      ../ext/rum.nix
      ../ext/timescaledb.nix
      ../ext/pgsodium.nix
      # ... 40+ extensions
    ];

    # Filter extensions for specific versions
    orioleFilteredExtensions = builtins.filter (
      x: x != ../ext/timescaledb.nix && x != ../ext/plv8
    ) ourExtensions;

    # Build all extensions for a version
    makeOurPostgresPkgs = version:
      map (path: pkgs.callPackage path { inherit postgresql; })
          extensionsToUse;

    # Create full PostgreSQL distribution
    makePostgres = version: {
      bin = makePostgresBin version;    # postgres + extensions
      exts = makeOurPostgresPkgsSet version;  # individual extensions
      recurseForDerivations = true;
    };

    basePackages = {
      psql_15 = makePostgres "15";
      psql_17 = makePostgres "17";
      psql_orioledb-17 = makePostgres "orioledb-17";
    };
  in
  {
    # Flatten nested structure into dot-separated names
    packages = inputs.flake-utils.lib.flattenTree basePackages;
  };
}
```

**flattenTree transformation**:
```nix
# Input:
{ psql_15.bin = <drv>; psql_15.exts.rum = <drv>; }

# Output:
{ "psql_15.bin" = <drv>; "psql_15.exts.rum" = <drv>; }
```

This allows `nix build .#psql_15.bin` or `nix build .#psql_15.exts.rum`.

#### nix/apps.nix

**Purpose**: Define runnable applications.

Maps packages to app definitions:

```nix
{ ... }:
{
  perSystem = { self', ... }:
  let
    mkApp = attrName: binName: {
      type = "app";
      program = "${self'.packages."${attrName}"}/bin/${binName}";
    };
  in
  {
    apps = {
      start-server = mkApp "start-server" "start-postgres-server";
      start-client = mkApp "start-client" "start-postgres-client";
      dbmate-tool = mkApp "dbmate-tool" "dbmate-tool";
    };
  };
}
```

**Usage**: `nix run .#start-server` executes the app.

#### nix/overlays/default.nix

**Purpose**: Define nixpkgs overlays.

Overlays are flake-level (not per-system):

```nix
{ self, ... }:
{
  flake.overlays.default = final: prev: {
    # Re-export packages from current system
    inherit (self.packages.${final.system})
      postgresql_15
      postgresql_17
      supabase-groonga;

    # Define new packages in terms of final/prev
    cargo-pgrx = final.callPackage ../cargo-pgrx/default.nix {
      inherit (final) lib darwin fetchCrate openssl;
    };

    # Override existing packages
    buildPgrxExtension = final.callPackage ../cargo-pgrx/buildPgrxExtension.nix {
      inherit (final) cargo-pgrx lib;
    };
  };
}
```

**Pattern**: The overlay is applied in `nix/nixpkgs.nix` to all systems.

#### nix/checks.nix

**Purpose**: Define build checks and tests.

```nix
{ self, ... }:
{
  perSystem = { lib, pkgs, self', system, ... }:
  {
    checks = {
      psql_15 = pkgs.runCommand "run-check-harness-psql-15" { }
        (lib.getExe (makeCheckHarness self'.packages."psql_15.bin"));
      psql_17 = pkgs.runCommand "run-check-harness-psql-17" { }
        (lib.getExe (makeCheckHarness self'.packages."psql_17.bin"));
    }
    // pkgs.lib.optionalAttrs (system == "x86_64-linux") {
      devShell = self'.devShells.default;
    };
  };
}
```

**Conditional outputs**: `optionalAttrs` includes checks only on x86_64-linux.

**Usage**: `nix flake check` runs all checks.

#### nix/devShells.nix

**Purpose**: Define development environments.

```nix
{ ... }:
{
  perSystem = { pkgs, self', config, ... }:
  {
    devShells = {
      default = pkgs.mkShell {
        packages = with pkgs; [
          coreutils
          just
          nix-update
          shellcheck
          self'.packages.start-server
          config.treefmt.build.wrapper
        ];
        shellHook = ''
          export HISTFILE=.history
          ${config.pre-commit.installationScript}
        '';
      };
    };
  };
}
```

**Cross-module references**:
- `self'.packages.start-server` - from packages module
- `config.treefmt.build.wrapper` - from fmt module
- `config.pre-commit.installationScript` - from hooks module

### Integration Modules

#### nix/fmt.nix

**Purpose**: Configure code formatting via treefmt-nix.

```nix
{ inputs, ... }:
{
  imports = [ inputs.treefmt-nix.flakeModule ];
  perSystem = { pkgs, ... }:
  {
    treefmt.programs = {
      deadnix.enable = true;
      nixfmt = {
        enable = true;
        package = pkgs.nixfmt-rfc-style;
      };
      ruff-format.enable = true;
    };
  };
}
```

**Module import**: `inputs.treefmt-nix.flakeModule` provides the `treefmt` option namespace.

**Exposed outputs**:
- `config.treefmt.build.wrapper` - available to other modules
- `formatter` - automatic flake output for `nix fmt`

#### nix/hooks.nix

**Purpose**: Configure git pre-commit hooks.

```nix
{ inputs, ... }:
{
  imports = [ inputs.git-hooks.flakeModule ];
  perSystem = { config, ... }:
  {
    pre-commit = {
      check.enable = true;
      settings.hooks = {
        treefmt = {
          enable = true;
          package = config.treefmt.build.wrapper;
        };
      };
    };
  };
}
```

**Cross-module dependency**: Uses `config.treefmt.build.wrapper` from `nix/fmt.nix`.

## Common Patterns

### Self-Reference

Modules reference outputs from other modules:

```nix
# Reference current system's packages
self'.packages."psql_15.bin"

# Reference flake-level config
self.supabase.defaults

# Reference flake-level overlay
self.overlays.default

# Reference inputs for current system
inputs'.nix-editor.packages.default
```

### Dependency Injection via callPackage

`pkgs.callPackage` automatically injects function arguments:

```nix
# File: nix/packages/dbmate-tool.nix
{ writeShellApplication, dbmate, ... }:
writeShellApplication {
  name = "dbmate-tool";
  # ...
}

# Usage in nix/packages/default.nix
dbmate-tool = pkgs.callPackage ./dbmate-tool.nix {
  # Override specific arguments
  inherit (self.supabase) defaults;
};
```

Arguments from `pkgs` are auto-injected; explicit args override.

### Recursive Package Sets

Allow building nested package paths:

```nix
{
  psql_15 = {
    bin = <derivation>;
    exts = {
      rum = <derivation>;
      pgsodium = <derivation>;
      recurseForDerivations = true;
    };
    recurseForDerivations = true;
  };
}
```

**Effect**: Enables `nix build .#psql_15.exts.rum`.

### Attribute Set Merging

Combine multiple package sources:

```nix
packages = (
  { manually-defined = ...; }
  // generatedPackages
  // lib.optionalAttrs (system == "x86_64-linux") {
    linux-only = ...;
  }
);
```

### Typed Configuration

Define schemas with `lib.types`:

```nix
let
  configType = lib.types.submodule {
    options = {
      port = lib.mkOption {
        type = lib.types.str;
        default = "5435";
        description = "PostgreSQL port";
      };
    };
  };
in {
  flake.options.supabase = lib.mkOption { type = configType; };
}
```

## Nixpkgs Library Functions

!!! tip "In-Depth Coverage"
    For detailed examples of how these functions work together with flake-parts, including the module system foundations and composition patterns, see **[Flake-Parts and nixpkgs lib](./flake-parts-nixpkgs-lib.md)**.

Common utilities from `pkgs.lib`:

| Function | Purpose | Example |
|----------|---------|---------|
| `lib.types.*` | Type definitions | `lib.types.str`, `lib.types.submodule` |
| `lib.mkOption` | Define typed options | `lib.mkOption { type = lib.types.str; }` |
| `lib.filterAttrs` | Filter attribute sets | `lib.filterAttrs (n: v: n != "override") pkgs` |
| `lib.mapAttrsToList` | Convert attrs to list | `lib.mapAttrsToList (n: v: { name = n; }) attrs` |
| `lib.optionalAttrs` | Conditional attributes | `lib.optionalAttrs (system == "x86_64-linux") {...}` |
| `lib.hasSuffix` | String suffix check | `lib.hasSuffix ".sql" filename` |
| `lib.makeBinPath` | Create PATH string | `lib.makeBinPath [ pkg1 pkg2 ]` |
| `lib.getExe` | Extract executable | `lib.getExe pkgs.hello` → `/nix/store/.../bin/hello` |
| `pkgs.callPackage` | Dependency injection | `pkgs.callPackage ./pkg.nix { extra = value; }` |
| `pkgs.symlinkJoin` | Merge package outputs | `pkgs.symlinkJoin { paths = [ pkg1 pkg2 ]; }` |

## Module Evaluation Order

1. **System selection**: Flake-parts evaluates modules once per declared system
2. **nixpkgs.nix**: Instantiates `pkgs` for current system with overlays
3. **config.nix**: Defines flake-wide configuration options
4. **overlays/**: Overlay definition (referenced by nixpkgs.nix)
5. **packages/**: Package definitions (uses `pkgs` and `self.supabase.config`)
6. **apps.nix**: App definitions (references `self'.packages`)
7. **devShells.nix**: Dev shells (references `self'.packages` and `config.*`)
8. **checks.nix**: Tests (references `self'.packages`)
9. **fmt.nix**, **hooks.nix**: Integration modules (expose `config.*`)

**Key insight**: `pkgs` is available to all modules because `nixpkgs.nix` sets `_module.args.pkgs`.

## Extending the Flake

### Adding a New Module

1. Create file in `nix/` directory:

```nix
# nix/my-module.nix
{ ... }:
{
  perSystem = { pkgs, self', ... }:
  {
    packages = {
      my-package = pkgs.writeShellScriptBin "my-script" ''
        echo "Hello from my module"
      '';
    };
  };
}
```

2. Import in `flake.nix`:

```nix
imports = [
  nix/apps.nix
  nix/my-module.nix  # Add here
  # ...
];
```

### Adding Flake-Level Configuration

Add to `nix/config.nix`:

```nix
flake.config.myConfig = {
  someOption = "value";
};
```

Access in other modules:

```nix
perSystem = { ... }:
{
  packages.example = pkgs.writeText "config.txt"
    self.myConfig.someOption;
};
```

## Benefits of This Architecture

1. **Modularity**: Each concern (packages, apps, checks) in separate files
2. **DRY**: Write per-system code once, evaluated for all systems
3. **Type Safety**: Typed configuration catches errors early
4. **Composability**: Import third-party modules (treefmt, git-hooks)
5. **Maintainability**: Easy to locate and modify specific functionality
6. **Clarity**: Self-documenting structure with clear separation of concerns

## Further Reading

- [Flake-parts documentation](https://flake.parts/)
- [NixOS module system](https://nixos.org/manual/nixos/stable/#sec-writing-modules)
- [Nixpkgs lib reference](https://nixos.org/manual/nixpkgs/stable/#chap-functions)
- [Nix flakes](https://nixos.wiki/wiki/Flakes)
