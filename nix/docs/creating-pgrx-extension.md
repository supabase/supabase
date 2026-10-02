# Creating a new pgrx extension

This guide covers how to set up a new cargo pgrx PostgreSQL extension in this project.

## Template: New pgrx extension

### 1. Directory Structure

Create your extension directory:

```
nix/ext/my_extension/
├── default.nix           # Nix build configuration
└── Cargo.lock.patch      # (optional) if upstream lacks Cargo.lock
```

### 2. Extension Nix File Template

Create `nix/ext/my_extension/default.nix`:

```nix
{
  lib,
  stdenv,
  callPackages,
  fetchFromGitHub,
  postgresql,
  buildEnv,
  rust-bin,
  pkg-config,
  openssl,
}:

let
  pname = "my_extension";

  build =
    version: hash: rustVersion: pgrxVersion:
    let
      cargo = rust-bin.stable.${rustVersion}.default;
      mkPgrxExtension = callPackages ../../cargo-pgrx/mkPgrxExtension.nix {
        inherit rustVersion pgrxVersion;
      };
    in
    mkPgrxExtension rec {
      inherit pname version postgresql;

      src = fetchFromGitHub {
        owner = "your-org";
        repo = pname;
        rev = "v${version}";
        inherit hash;
      };

      nativeBuildInputs = [ pkg-config cargo ];
      buildInputs = [ openssl postgresql ];

      CARGO = "${cargo}/bin/cargo";

      cargoLock = {
        lockFile = "${src}/Cargo.lock";
        # Add outputHashes if you have git dependencies:
        # outputHashes = {
        #   "some-crate-0.1.0" = "sha256-...";
        # };
      };

      # Optional: if extension's Cargo.toml needs modification
      # preConfigure = ''
      #   sed -i 's/pgrx = "0.12"/pgrx = "0.12.6"/' Cargo.toml
      # '';

      meta = with lib; {
        description = "Description of your extension";
        homepage = "https://github.com/your-org/${pname}";
        license = licenses.mit;  # adjust as needed
      };
    };

  allVersions = (builtins.fromJSON (builtins.readFile ../versions.json)).${pname};

  supportedVersions = lib.filterAttrs (
    _: value: builtins.elem (lib.versions.major postgresql.version) value.postgresql
  ) allVersions;

  versions = lib.naturalSort (lib.attrNames supportedVersions);
  latestVersion = lib.last versions;

  packages = map (
    version:
    let
      v = supportedVersions.${version};
    in
    build version v.hash v.rust v.pgrx
  ) versions;
in
buildEnv {
  name = pname;
  paths = packages;
  pathsToLink = [
    "/lib"
    "/share/postgresql/extension"
  ];

  postBuild = ''
    # Create version-specific SQL symlinks for migrations
    ${lib.concatMapStringsSep "\n" (version: ''
      if [ -f $out/share/postgresql/extension/${pname}--${version}.sql ]; then
        ln -sf ${pname}--${version}.sql $out/share/postgresql/extension/${pname}--${latestVersion}--${version}.sql 2>/dev/null || true
      fi
    '') versions}
  '';
}
```

### 3. Add to versions.json

Edit `nix/ext/versions.json` and add your extension:

```json
{
  "my_extension": {
    "0.1.0": {
      "postgresql": ["15", "17"],
      "hash": "",
      "pgrx": "0.12.6",
      "rust": "1.80.0"
    }
  }
}
```

Run the following to calculate content hash:

```bash
nix build .#psql_15.exts.my_extension -L
```

The error message will show the correct hash, update the `hash` attribute in versions.json.

### 4. Register in postgres.nix

Edit `nix/packages/postgres.nix` and add to the `ourExtensions` list:

```nix
ourExtensions = [
  # ... existing extensions ...
  ../ext/my_extension/default.nix
];
```

## Files to Modify (Summary)

| File                                  | Change                          |
| ------------------------------------- | ------------------------------- |
| `nix/ext/my_extension/default.nix`    | Create new file                 |
| `nix/ext/versions.json`               | Add version entry               |
| `nix/packages/postgres.nix`           | Add to `ourExtensions` list     |
| `nix/tests/sql/my_extension.sql`      | (optional) Add test SQL         |
| `nix/tests/expected/my_extension.out` | (optional) Expected test output |

## Build Commands

```bash
# Build extension for PostgreSQL 15
nix build .#psql_15.exts.my_extension -L

# Build extension for PostgreSQL 17
nix build .#psql_17.exts.my_extension -L

# Build all extensions (full PostgreSQL package)
nix build .#psql_15.bin -L

# Run tests
nix flake check -L
```

## Quick Reference: pgrx + Rust Version Combinations

From `nix/cargo-pgrx/versions.json`:

| pgrx Version | Rust Version   |
| ------------ | -------------- |
| 0.12.6       | 1.80.0, 1.81.0 |
| 0.14.3       | 1.87.0         |

Match your extension's pgrx dependency to a supported combination.

## Existing Examples to Reference

| Extension     | Path                                | Notes                 |
| ------------- | ----------------------------------- | --------------------- |
| pg_graphql    | `nix/ext/pg_graphql/default.nix`    | Clean pgrx example    |
| pg_jsonschema | `nix/ext/pg_jsonschema/default.nix` | Simple single-crate   |
| wrappers      | `nix/ext/wrappers/default.nix`      | Complex with git deps |
