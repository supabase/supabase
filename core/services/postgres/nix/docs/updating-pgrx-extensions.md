# Updating cargo-pgrx Extensions

This guide covers the complete process for updating Rust-based PostgreSQL extensions that use `pgrx` (formerly `pgx`). These extensions include `wrappers`, `pg_graphql`, and `pg_jsonschema`.

## Overview

Updating a pgrx extension can involve one or more of these changes:

1. **Extension version only** - New release of the extension with same Rust/pgrx versions
2. **Extension + pgrx version** - Extension requires a newer pgrx version
3. **Extension + pgrx + Rust version** - Full stack update including the Rust toolchain

Each scenario requires different file changes. This guide covers all three.


## Quick Reference: File Locations

| Purpose | File |
|---------|------|
| Extension versions | `nix/ext/versions.json` |
| Extension-specific config | `nix/ext/<name>/default.nix` |
| pgrx versions + Rust mappings | `nix/cargo-pgrx/versions.json` |
| cargo-pgrx package definitions | `nix/cargo-pgrx/default.nix` |
| pgrx extension builder | `nix/cargo-pgrx/mkPgrxExtension.nix` |
| Overlays (buildPgrxExtension_*) | `nix/overlays/default.nix` |
| Rust toolchain source | `flake.nix` (rust-overlay input) |
| Pinned rust-overlay version | `flake.lock` |

---

## Summary: Which Scenario Am I In?

| Situation | Scenario |
|-----------|----------|
| Same pgrx and Rust as previous version | 1 - Extension only |
| Extension's Cargo.toml has newer pgrx | 2 - Extension + pgrx |
| Extension requires Rust version not in rust-overlay | 3 - Full stack update |
| "attribute missing" error for Rust version | 3 - Need `nix flake update rust-overlay` |

---

## 1. Updating Extension Version Only

Use this when the extension has a new release but uses the same pgrx and Rust versions as a previous version.

### Files to Change

| File | Change |
|------|--------|
| `nix/ext/versions.json` | Add new version entry |
| `nix/ext/<extension>/default.nix` | Add old version to `allPreviouslyPackagedVersions` |

### Steps

1. **Edit `nix/ext/versions.json`** - Add the new version entry:

   ```json
   "wrappers": {
     "0.5.6": {
       "postgresql": ["15", "17", "orioledb-17"],
       "hash": "sha256-...",
       "pgrx": "0.16.0",
       "rust": "1.87.0"
     },
     "0.5.7": {
       "postgresql": ["15", "17", "orioledb-17"],
       "hash": "",
       "pgrx": "0.16.0",
       "rust": "1.87.0"
     }
   }
   ```

   - Copy the `pgrx` and `rust` values from the previous version
   - Set `hash` to `""` initially

2. **Update `allPreviouslyPackagedVersions`** in `nix/ext/<extension>/default.nix`:

   ```nix
   allPreviouslyPackagedVersions = [
     "0.5.6"  # Add the previous version here
     "0.5.5"
     # ... older versions
   ];
   ```

   This ensures migration SQL files are created for users upgrading from older versions.

3. **Stage your changes**:

   ```bash
   git add .
   ```

4. **Build to get the hash**:

   ```bash
   nix build .#psql_17.exts.wrappers -L
   ```

   The build will fail and print the correct hash. Copy it to `versions.json`.

5. **Rebuild to verify**:

   ```bash
   nix build .#psql_17.exts.wrappers -L
   ```

---

## 2. Updating Extension + pgrx Version

Use this when the extension requires a newer pgrx version.

### Files to Change

| File | Change |
|------|--------|
| `nix/ext/versions.json` | Add new version with new pgrx version |
| `nix/ext/<extension>/default.nix` | Add old version to `allPreviouslyPackagedVersions` |
| `nix/cargo-pgrx/versions.json` | Add new pgrx version (if not already present) |

### Steps

1. **Check if the pgrx version exists** in `nix/cargo-pgrx/versions.json`:

   ```bash
   cat nix/cargo-pgrx/versions.json | grep "0.16.1"
   ```

2. **If pgrx version doesn't exist**, add it to `nix/cargo-pgrx/versions.json`:

   ```json
   "0.16.1": {
     "hash": "",
     "rust": {
       "1.88.0": {
         "cargoHash": ""
       }
     }
   }
   ```

   The `rust` object maps Rust versions to their corresponding `cargoHash`.
   You'll need to calculate both the `hash` (for the pgrx crate) and `cargoHash` (for cargo dependencies).

3. **Update `nix/ext/versions.json`** with the new extension version:

   ```json
   "0.5.7": {
     "postgresql": ["15", "17", "orioledb-17"],
     "hash": "",
     "pgrx": "0.16.1",
     "rust": "1.88.0"
   }
   ```

4. **Stage and build** to calculate hashes:

   ```bash
   git add .
   nix build .#psql_17.exts.wrappers -L
   ```

   You'll need to run this multiple times, updating hashes as they're calculated:
   - First failure: pgrx crate hash
   - Second failure: cargoHash for pgrx
   - Third failure: extension hash

---

## 3. Updating Extension + pgrx + Rust Version

Use this when you need a newer Rust toolchain version.

### Files to Change

All files from scenario 2, plus:

| File | Change |
|------|--------|
| `flake.lock` | Update rust-overlay input |

### Understanding rust-overlay

The Rust toolchain comes from the `rust-overlay` flake input. This overlay provides pre-built Rust versions with hashes already calculated. The overlay is updated daily on GitHub, but your local `flake.lock` pins a specific version.

### Steps

1. **Check if your Rust version is available**:

   ```bash
   nix eval --raw --impure --expr '
   let
     flake = builtins.getFlake (toString ./.);
     pkgs = import flake.inputs.nixpkgs {
       system = builtins.currentSystem;
       overlays = [ (import flake.inputs.rust-overlay) ];
     };
   in
   builtins.concatStringsSep "\n" (builtins.attrNames pkgs.rust-bin.stable)
   '
   ```

   This lists all available stable Rust versions.

2. **If your Rust version is missing, update rust-overlay**:

   ```bash
   nix flake update rust-overlay
   ```

   > **IMPORTANT**: Use `nix flake update rust-overlay` (with the input name) to update ONLY the rust-overlay input. Running `nix flake update` without arguments updates ALL inputs, which WILL cause unintended changes.

3. **Verify the version is now available**:

   ```bash
   nix eval --raw --impure --expr '
   let
     flake = builtins.getFlake (toString ./.);
     pkgs = import flake.inputs.nixpkgs {
       system = builtins.currentSystem;
       overlays = [ (import flake.inputs.rust-overlay) ];
     };
   in
   builtins.concatStringsSep "\n" (builtins.attrNames pkgs.rust-bin.stable)
   ' | grep "1.88.0"
   ```

4. **Add the new Rust version to pgrx mappings** in `nix/cargo-pgrx/versions.json`:

   ```json
   "0.16.1": {
     "hash": "sha256-...",
     "rust": {
       "1.87.0": {
         "cargoHash": "sha256-..."
       },
       "1.88.0": {
         "cargoHash": ""
       }
     }
   }
   ```

   Each pgrx version can support multiple Rust versions. The `cargoHash` may differ between Rust versions.

5. **Continue with extension update** as in scenario 2.

---

## 4. Verification with `nix flake check`

After making changes, verify everything works:

```bash
nix flake check -L
```

The `-L` flag shows full build logs, which is essential for debugging.

### What `nix flake check` verifies:

- All extension builds for all PostgreSQL versions
- Extension test suites
- Migration path validity (upgrade scripts between versions)
- Package structure integrity

### Testing a specific extension first:

For faster iteration, test just your extension before running full checks:

```bash
# Build for one PostgreSQL version
nix build .#psql_17.exts.wrappers -L

# Build for all PostgreSQL versions
nix build .#psql_15.exts.wrappers -L
nix build .#psql_17.exts.wrappers -L
```

---

## 5. Troubleshooting

### Error: `attribute '"X.Y.Z"' missing`

**Example:**
```
error: attribute '"1.88.0"' missing
at /nix/store/.../nix/ext/wrappers/default.nix:19:15:
    cargo = rust-bin.stable.${rustVersion}.default;
Did you mean one of 1.38.0, 1.48.0, 1.58.0, 1.68.0 or 1.78.0?
```

**Cause:** The Rust version specified in `versions.json` isn't available in your pinned `rust-overlay`.

**Solution:**
```bash
nix flake update rust-overlay
```

Then verify the version is available (see section 3).

### Error: `Unsupported pgrx version X.Y.Z`

**Cause:** The pgrx version in `versions.json` isn't defined in `nix/cargo-pgrx/versions.json`.

**Solution:** Add the pgrx version entry to `nix/cargo-pgrx/versions.json` with appropriate Rust version mappings.

### Error: `Unsupported rust version X.Y.Z for pgrx version A.B.C`

**Cause:** The Rust version isn't mapped for this pgrx version in `nix/cargo-pgrx/versions.json`.

**Solution:** Add the Rust version to the pgrx entry:

```json
"0.16.1": {
  "hash": "sha256-...",
  "rust": {
    "1.87.0": { "cargoHash": "sha256-..." },
    "1.88.0": { "cargoHash": "" }  // Add this
  }
}
```

### Hash Calculation Failures

When calculating hashes, you'll see errors like:

```
hash mismatch in fixed-output derivation:
  wanted: sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
  got:    sha256-xYz123ActualHashValue...=
```

Copy the `got` value to replace the empty or incorrect hash.

### Build Fails After Hash Update

If the build still fails after updating hashes:

1. **Stage all changes**: `git add .`
2. **Clean Nix cache** (if necessary): `nix store gc`
3. **Rebuild**: `nix build .#psql_17.exts.<extension> -L`

### CargoLock outputHashes

Some extensions (like wrappers) have git dependencies that require `outputHashes` in their `cargoLock` configuration. If you see errors about missing hashes for git dependencies:

1. Check the extension's `default.nix` for the `cargoLock.outputHashes` section
2. Add any new git dependencies with their calculated hashes

---
