# Flake-Parts and nixpkgs lib Foundations

This document explains how flake-parts leverages nixpkgs lib to provide a powerful module system for organizing Nix flakes, with examples from this repository's implementation.

!!! note "Related Documentation"
    This page focuses on the nixpkgs lib foundations and how flake-parts uses them. For a high-level overview of the module structure and practical usage patterns, see **[Flake-Parts Architecture](./flake-parts-architecture.md)**.

## Overview

Flake-parts is built on top of the **nixpkgs module system** (`lib.modules`), which is the same foundation used by NixOS configuration. Understanding this relationship helps you reason about how flake-parts works and why it's designed the way it is.

## The nixpkgs lib Module System

### Core Components

Flake-parts leverages these fundamental nixpkgs lib components:

| Component | Purpose | Example Usage |
|-----------|---------|---------------|
| `lib.mkOption` | Declare configuration options | Define typed module options |
| `lib.types.*` | Type checking and validation | Ensure configuration correctness |
| `lib.mkIf` | Conditional configuration | Include config based on conditions |
| `lib.mkMerge` | Merge multiple configurations | Combine attribute sets |
| `lib.mkDefault` | Default values with priority | Set overridable defaults |
| `lib.evalModules` | Evaluate module system | Process module imports |

### How flake-parts Uses lib.modules

When you call `mkFlake`, flake-parts internally uses `lib.evalModules` to:

1. **Evaluate all imported modules** - Process each module in the `imports` list
2. **Merge configurations** - Combine options from all modules
3. **Type-check values** - Validate configuration against option types
4. **Generate outputs** - Transform module config into flake outputs

```nix
# Simplified internal implementation
mkFlake = { inputs }: moduleArgs:
  let
    evaluated = lib.evalModules {
      modules = [ baseModule ] ++ moduleArgs.imports;
      specialArgs = { inherit inputs; };
    };
  in
    evaluated.config.flake;
```

## Key nixpkgs lib Functions in Action

### 1. lib.genAttrs - System Generation

Flake-parts uses `lib.genAttrs` to generate per-system outputs:

```nix
# Internal flake-parts logic
systems = [ "x86_64-linux" "aarch64-linux" "aarch64-darwin" ];
packages = lib.genAttrs systems (system:
  # Your perSystem config evaluated for each system
  perSystemConfig.packages
);
```

**In our flake:**
```nix
systems = with flake-utils.lib; [
  system.x86_64-linux
  system.aarch64-linux
  system.aarch64-darwin
];
```

This generates outputs for all three systems automatically.

### 2. lib.mapAttrs - Attribute Transformation

Used to transform outputs across systems:

```nix
# Transform all packages to add metadata
packages = lib.mapAttrs (name: drv:
  drv.overrideAttrs (old: {
    meta = old.meta or {} // { platforms = [ system ]; };
  })
) perSystemPackages;
```

**In our postgres.nix:**
```nix
makeOurPostgresPkgsSet = version:
  (builtins.listToAttrs (
    map (drv: {
      name = drv.pname;
      value = drv;
    }) (makeOurPostgresPkgs version)
  ))
  // { recurseForDerivations = true; };
```

### 3. lib.recursiveUpdate - Deep Merging

Merges nested attribute sets:

```nix
packages = lib.recursiveUpdate {
  default = myPackage;
} {
  tools = { cli = cliTool; };
};
# Result: { default = ...; tools.cli = ...; }
```

**In our checks.nix:**
```nix
checks = {
  psql_15 = ...;
  psql_17 = ...;
}
// pkgs.lib.optionalAttrs (system == "x86_64-linux") {
  devShell = self'.devShells.default;
}
// pkgs.lib.optionalAttrs (system == "x86_64-linux") (
  import ./ext/tests { ... }
);
```

### 4. lib.filterAttrs - Selective Inclusion

Filters attribute sets by predicate:

```nix
# Remove internal attributes
publicPackages = lib.filterAttrs
  (n: _: n != "override" && n != "overrideAttrs")
  allPackages;
```

**In our packages/default.nix:**
```nix
packages = (
  { /* hand-written packages */ }
  // lib.filterAttrs
    (n: _v: n != "override" && n != "overrideAttrs" && n != "overrideDerivation")
    (pkgs.callPackage ../postgresql/default.nix { ... })
);
```

## The perSystem Abstraction

### Standard Flake Pattern (Verbose)

Without flake-parts, you'd write:

```nix
outputs = { self, nixpkgs }: {
  packages.x86_64-linux.hello =
    nixpkgs.legacyPackages.x86_64-linux.hello;
  packages.aarch64-linux.hello =
    nixpkgs.legacyPackages.aarch64-linux.hello;
  packages.aarch64-darwin.hello =
    nixpkgs.legacyPackages.aarch64-darwin.hello;

  devShells.x86_64-linux.default =
    nixpkgs.legacyPackages.x86_64-linux.mkShell { ... };
  devShells.aarch64-linux.default =
    nixpkgs.legacyPackages.aarch64-linux.mkShell { ... };
  devShells.aarch64-darwin.default =
    nixpkgs.legacyPackages.aarch64-darwin.mkShell { ... };
};
```

### flake-parts Pattern (DRY)

With flake-parts, you write once:

```nix
perSystem = { pkgs, system, ... }: {
  packages.hello = pkgs.hello;
  devShells.default = pkgs.mkShell { ... };
};
```

Flake-parts expands this using `lib.genAttrs` under the hood:

```nix
# What flake-parts generates
let
  perSystemOutputs = system:
    let pkgs = import nixpkgs { inherit system; };
    in {
      packages.hello = pkgs.hello;
      devShells.default = pkgs.mkShell { ... };
    };
in {
  packages = lib.genAttrs systems (system:
    (perSystemOutputs system).packages
  );
  devShells = lib.genAttrs systems (system:
    (perSystemOutputs system).devShells
  );
}
```

## Module Composition with lib

### Import System

Flake-parts uses the nixpkgs module `imports` mechanism:

```nix
imports = [
  ./nix/apps.nix          # Custom module
  ./nix/checks.nix        # Custom module
  inputs.treefmt-nix.flakeModule    # Third-party module
  inputs.git-hooks.flakeModule      # Third-party module
];
```

Each imported module can:
- Define options with `lib.mkOption`
- Set configuration values
- Import other modules
- Access shared state

### Module Pattern

**Basic module structure:**

```nix
{ lib, ... }:
{
  options = {
    myProject.enable = lib.mkOption {
      type = lib.types.bool;
      default = false;
      description = "Enable my project";
    };
  };

  config = lib.mkIf config.myProject.enable {
    perSystem = { pkgs, ... }: {
      packages.myPackage = pkgs.hello;
    };
  };
}
```

**In our config.nix:**

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
  flake.options.supabase = lib.mkOption {
    type = lib.types.submodule {
      options.defaults = lib.mkOption {
        type = postgresqlDefaults;
      };
    };
  };
  flake.config.supabase = { defaults = { }; };
}
```

## Type Safety with lib.types

Flake-parts leverages nixpkgs type system for validation:

### Common Types

```nix
lib.types.str          # String
lib.types.int          # Integer
lib.types.bool         # Boolean
lib.types.path         # File system path
lib.types.package      # Nix derivation
lib.types.listOf T     # List of type T
lib.types.attrsOf T    # Attribute set with values of type T
lib.types.enum [...]   # Enumeration
lib.types.submodule    # Nested module
lib.types.nullOr T     # T or null
```

### Submodules for Structure

**In our config.nix:**

```nix
postgresqlVersion = lib.types.submodule {
  options = {
    version = lib.mkOption { type = lib.types.str; };
    hash = lib.mkOption { type = lib.types.str; };
    revision = lib.mkOption {
      type = lib.types.nullOr lib.types.str;
      default = null;
    };
  };
};

supabaseSubmodule = lib.types.submodule {
  options = {
    defaults = lib.mkOption { type = postgresqlDefaults; };
    supportedPostgresVersions = lib.mkOption {
      type = lib.types.attrsOf (lib.types.attrsOf postgresqlVersion);
      default = { };
    };
  };
};
```

This provides:
- **Compile-time validation** - Catches type errors early
- **Auto-documentation** - Types serve as documentation
- **IDE support** - Better completion and hints

## Advanced Patterns

### 1. Conditional Configuration with lib.mkIf

```nix
perSystem = { pkgs, system, config, ... }: {
  packages = lib.mkIf (system == "x86_64-linux") {
    linux-only-tool = pkgs.callPackage ./tool.nix { };
  };
};
```

**In our checks.nix:**

```nix
checks = { ... }
  // pkgs.lib.optionalAttrs (system == "x86_64-linux") {
    inherit (self'.packages)
      postgresql_15_debug
      postgresql_17_debug;
  };
```

### 2. Priority System with lib.mkDefault

```nix
options.port = lib.mkOption {
  type = lib.types.str;
  default = lib.mkDefault "5432";  # Low priority
};

config.port = "5435";  # Higher priority, overrides
```

### 3. List Merging with lib.mkMerge

```nix
config.packages = lib.mkMerge [
  { base = basePackage; }
  (lib.mkIf enableExtras { extra = extraPackage; })
  { tools = toolsPackage; }
];
```

### 4. Cross-System References with withSystem

```nix
flake.nixosModules.postgres = { config, ... }: {
  options.services.supabase-postgres.package = lib.mkOption {
    type = lib.types.package;
    default = inputs.self.packages.${config.nixpkgs.system}.psql_17;
  };
};
```

## Composition Patterns in This Project

### Extension Composition

**postgres.nix demonstrates functional composition:**

```nix
let
  # Base extensions
  ourExtensions = [
    ../ext/rum.nix
    ../ext/timescaledb.nix
    ../ext/pgsodium.nix
    # ... 40+ extensions
  ];

  # Filtered for specific versions
  orioleFilteredExtensions = builtins.filter (
    x: x != ../ext/timescaledb.nix && x != ../ext/plv8
  ) ourExtensions;

  orioledbExtensions = orioleFilteredExtensions ++ [ ../ext/orioledb.nix ];

  # Select extensions based on version
  extensionsForVersion = version:
    if version == "orioledb-17" then orioledbExtensions
    else if version == "17" then dbExtensions17
    else ourExtensions;

  # Build extensions
  makeOurPostgresPkgs = version:
    map (path: pkgs.callPackage path { inherit postgresql; })
        (extensionsForVersion version);
in
{
  packages = {
    psql_15 = makePostgres "15";
    psql_17 = makePostgres "17";
    psql_orioledb-17 = makePostgres "orioledb-17";
  };
}
```

### Package Set Flattening

**Using flake-utils.lib.flattenTree:**

```nix
# Input structure
basePackages = {
  psql_15 = {
    bin = <derivation>;
    exts = {
      rum = <derivation>;
      pgsodium = <derivation>;
    };
  };
};

# Flatten to dot notation
packages = inputs.flake-utils.lib.flattenTree basePackages;

# Result
{
  "psql_15.bin" = <derivation>;
  "psql_15.exts.rum" = <derivation>;
  "psql_15.exts.pgsodium" = <derivation>;
}
```

### Attribute Set Merging

**checks.nix merges multiple package sources:**

```nix
checks =
  {
    # Explicit checks
    psql_15 = makeCheckHarness self'.packages."psql_15.bin";
    psql_17 = makeCheckHarness self'.packages."psql_17.bin";
  }
  // pkgs.lib.optionalAttrs (system == "x86_64-linux") {
    # Debug packages (Linux only)
    inherit (self'.packages)
      postgresql_15_debug
      postgresql_17_debug;
  }
  // pkgs.lib.optionalAttrs (system == "x86_64-linux") (
    # Extension tests (Linux only)
    import ./ext/tests { inherit self pkgs; }
  );
```

## Advantages Over Standard Flakes

### 1. Reduced Boilerplate

**Before (standard flake):**
```nix
{
  packages.x86_64-linux.postgres = ...;
  packages.aarch64-linux.postgres = ...;
  packages.aarch64-darwin.postgres = ...;
  apps.x86_64-linux.server = ...;
  apps.aarch64-linux.server = ...;
  apps.aarch64-darwin.server = ...;
  # Repeat for every output type
}
```

**After (flake-parts):**
```nix
perSystem = { pkgs, ... }: {
  packages.postgres = ...;
  apps.server = ...;
};
```

### 2. Module Reusability

Extract common logic to modules:

```nix
# modules/postgres-common.nix
{ lib, ... }:
{
  options.postgresDefaults = lib.mkOption {
    type = lib.types.submodule {
      options = {
        port = lib.mkOption { type = lib.types.str; };
        superuser = lib.mkOption { type = lib.types.str; };
      };
    };
  };
}

# Import in multiple projects
imports = [ ./modules/postgres-common.nix ];
```

### 3. Type-Safe Configuration

```nix
# Define schema
options.postgresVersion = lib.mkOption {
  type = lib.types.enum ["15" "17"];
  default = "17";
};

# Type error caught at evaluation
config.postgresVersion = "16";  # Error: value "16" is not in enum
```

### 4. Third-Party Integration

Seamlessly integrate external modules:

```nix
imports = [
  inputs.treefmt-nix.flakeModule    # Adds 'treefmt' options
  inputs.git-hooks.flakeModule      # Adds 'pre-commit' options
];

perSystem = { config, ... }: {
  treefmt.programs.nixfmt.enable = true;
  pre-commit.settings.hooks.treefmt = {
    enable = true;
    package = config.treefmt.build.wrapper;  # Cross-module reference
  };
};
```

## Navigation Strategy

When working with this flake:

### 1. Start at the Entry Point

```
flake.nix → inputs.flake-parts.lib.mkFlake
            ├── systems (which architectures)
            ├── imports (feature modules)
            └── perSystem outputs
```

### 2. Follow Module Imports

```nix
imports = [
  nix/apps.nix         # Runnable commands
  nix/checks.nix       # Tests and validation
  nix/config.nix       # Configuration options
  nix/devShells.nix    # Development environments
  nix/nixpkgs.nix      # nixpkgs configuration
  nix/packages         # Package definitions
  nix/overlays         # Package overlays
];
```

### 3. Understand perSystem Context

Each perSystem block has access to:

```nix
perSystem = {
  # Special arguments
  self',      # Current system's outputs
  inputs',    # Current system's inputs
  pkgs,       # nixpkgs for current system
  system,     # System string
  lib,        # nixpkgs lib
  config,     # Module config
  ...
}: {
  # Your outputs
}
```

### 4. Trace Helper Functions

**In postgres.nix:**
```
makePostgres
  └── makePostgresBin
      ├── makeOurPostgresPkgs
      │   └── extensionsForVersion
      └── makeReceipt
```

## Practical Examples

### Adding a New PostgreSQL Version

```nix
# nix/config.nix
flake.config.supabase.supportedPostgresVersions.postgres."18" = {
  version = "18.0";
  hash = "sha256-...";
};

# nix/packages/postgres.nix
basePackages = {
  psql_15 = makePostgres "15";
  psql_17 = makePostgres "17";
  psql_18 = makePostgres "18";  # Add here
};
```

### Adding a Custom Extension

```nix
# nix/ext/my_extension.nix
{ postgresql, stdenv, fetchFromGitHub }:
stdenv.mkDerivation {
  pname = "my_extension";
  version = "1.0.0";

  src = fetchFromGitHub { ... };

  buildInputs = [ postgresql ];

  installPhase = ''
    install -D -t $out/lib *.so
    install -D -t $out/share/postgresql/extension *.sql
    install -D -t $out/share/postgresql/extension *.control
  '';
}

# nix/packages/postgres.nix
ourExtensions = [
  # ... existing extensions
  ../ext/my_extension.nix
];
```

### Adding Development Tools

```nix
# nix/devShells.nix
perSystem = { pkgs, self', config, ... }: {
  devShells.default = pkgs.mkShell {
    packages = [
      pkgs.postgresql
      self'.packages.start-server
      config.treefmt.build.wrapper
    ];
    shellHook = ''
      echo "PostgreSQL development environment"
      echo "Run: start-server 15"
    '';
  };
};
```

## Key Insights

The Supabase Postgres project demonstrates how flake-parts and nixpkgs lib work together to create:

1. **Systematic organization** - Clear separation of concerns via modules
2. **Type safety** - Configuration validated at evaluation time
3. **Reusability** - Helper functions eliminate duplication
4. **Extensibility** - New versions/extensions slot in easily
5. **Integration** - Third-party modules compose seamlessly
6. **Maintainability** - Changes localized to relevant modules

This architecture scales well for complex multi-version software builds, making it ideal for a PostgreSQL distribution with 40+ extensions across multiple versions.

## Further Reading

- [Nixpkgs lib reference](https://nixos.org/manual/nixpkgs/stable/#chap-functions)
- [NixOS module system](https://nixos.org/manual/nixos/stable/#sec-writing-modules)
- [Flake-parts documentation](https://flake.parts/)
- [Flake-parts module options](https://flake.parts/options/flake-parts.html)
