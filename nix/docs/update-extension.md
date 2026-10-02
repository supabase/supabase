# Update an existing nix extension

## Overview

There are two types of extension package structures in our codebase:

1. **Old structure (deprecated)**: Extensions like `supautils.nix` that directly define a single version in the nix expression for the package
2. **New structure (current standard)**: Extensions that load multiple versions from `nix/ext/versions.json`

Most extensions now use the new structure, which supports multiple versions via the `versions.json` file. The instructions below cover both approaches.

---

## Adding a Version to an Extension (New Structure - Recommended)

The new structure uses `nix/ext/versions.json` to manage multiple versions of extensions. Extensions that use this structure typically load their versions dynamically using code like:

```nix
allVersions = (builtins.fromJSON (builtins.readFile ./versions.json)).${pname};
```

### For Typical Extensions (e.g., http, pg_net, pgsodium, postgis, vector)

These extensions use `stdenv.mkDerivation` and require only basic fields in `versions.json`.

1. **Create a branch off of `develop`**

2. **Update `nix/ext/versions.json`** - Add a new version entry for your extension:
   ```json
   "extension_name": {
     "x.y.z": {
       "postgresql": ["15", "17"],
       "hash": ""
     }
   }
   ```

   Fields:
   - `"x.y.z"`: The version number (e.g., `"1.6.1"`)
   - `"postgresql"`: List of PostgreSQL major versions this extension supports (e.g., `["15", "17"]`)
   - `"hash"`: Initially set to `""` (we'll calculate this next)
   - `"rev"` (optional): Some extensions use a specific git rev/tag (e.g., `"v1.6.4"`)
   - `"patches"` (optional): Array of patch files if needed (e.g., `["pg_cron-1.3.1-pg15.patch"]`)

3. **Calculate the hash** - Run a nix build to get the correct hash:
   ```bash
   nix build .#psql_15.exts.extension_name -L
   ```

   Nix will fail and print the correct hash. Copy it and update the `hash` field in `versions.json`.

4. **Re-run the build** to verify:
   ```bash
   nix build .#psql_15.exts.extension_name -L
   ```

5. **Add any needed migrations** into the `supabase/postgres` migrations directory

6. **Update `ansible/vars.yml`** with the new version as usual

7. **Run tests locally** to verify the update succeeded:
   ```bash
   nix flake check -L
   ```

   This will:
   - Build all extension versions
   - Run all test suites
   - Verify package integrity
   - Check for any breaking changes

8. **Ready for PR review**

9. **Once approved**: If you want the change in a release, update `common-nix.vars.yml` with the new version prior to merging

### For Rust/pgrx Extensions (e.g., wrappers, pg_jsonschema, pg_graphql)

These extensions use `mkPgrxExtension` and require additional Rust and pgrx version information.

1. **Create a branch off of `develop`**

2. **Update `nix/ext/versions.json`** - Add a new version entry with Rust/pgrx fields:
   ```json
   "extension_name": {
     "x.y.z": {
       "postgresql": ["15", "17"],
       "hash": "",
       "pgrx": "0.12.6",
       "rust": "1.81.0"
     }
   }
   ```

   Fields:
   - `"x.y.z"`: The version number
   - `"postgresql"`: List of PostgreSQL major versions supported
   - `"hash"`: Initially set to `""` (calculate in next step)
   - `"pgrx"`: pgrx version (check the extension's Cargo.toml or use the current standard version)
   - `"rust"`: Rust toolchain version (check the extension's requirements or use current standard)

3. **Calculate the hash**:

   ```bash
   nix build .#psql_15.exts.extension_name -L
   ```

   Nix build will fail and print the correct hash. Update the `hash` field in `versions.json`.

   If needed, you can access the extension name by running the command `nix flake show`

4. **Update `previouslyPackagedVersions`** in the extension's `default.nix` file:

   For pgrx extensions, you need to add the previous version to the `previouslyPackagedVersions` list. For example, in `nix/ext/wrappers/default.nix`:

   ```nix
   previouslyPackagedVersions = [
     "0.5.3"  # ← Add the old version here when adding 0.5.4
     "0.5.2"
     # ... other versions
   ];
   ```

   This ensures that migration paths are created for users upgrading from older versions.

5. **Re-run the build** to verify:
   ```bash
   nix build .#psql_15.exts.extension_name -L
   ```

6. **Add any needed migrations** into the `supabase/postgres` migrations directory

7. **Update `ansible/vars.yml`** with the new version

8. **Run full test suite**:
   ```bash
   nix flake check -L
   ```

   For pgrx extensions, this will also verify that migration paths work correctly.

9.  **Ready for PR review**

10. **Once approved**: Update `common-nix.vars.yml` if releasing

> **Need to update pgrx or Rust versions?** See [Updating cargo-pgrx Extensions](./updating-pgrx-extensions.md) for the complete guide covering pgrx version updates, Rust toolchain updates (including `nix flake update rust-overlay`), and troubleshooting.

---

## Updating an Extension (Old Structure - Deprecated)

**Note**: This structure is being phased out. New extensions should use the `versions.json` approach above.

For extensions like `supautils.nix` that haven't been migrated to the new structure yet:

1. **Create a branch off of `develop`**

2. **Update the version** directly in the `.nix` file:
   ```nix
   version = "3.0.0";  # Update this
   ```

3. **Temporarily clear the hash**:
   ```nix
   hash = "";  # Clear this temporarily
   ```

   Save the file and stage it: `git add .`

4. **Calculate the hash**:
   ```bash
   nix build .#psql_15.exts.supautils -L
   ```

   Nix will print the calculated sha256 value.

5. **Update the hash** with the calculated value:
   ```nix
   hash = "sha256-EKKjNZQf7HwP/MxpHoPtbEtwXk+wO241GoXVcXpDMFs=";
   ```

6. **Re-run the build**:
   ```bash
   nix build .#psql_15.exts.supautils -L
   ```

7. **Add migrations** as needed

8. **Update `ansible/vars.yml`**

9. **Run tests**:
   ```bash
   nix flake check -L
   ```

10. **PR review and merge** (update `common-nix.vars.yml` if releasing)

---

## Understanding `nix flake check -L`

The `nix flake check -L` command is your primary local testing tool:

- **`-L`**: Shows full build logs (useful for debugging failures)
- **What it checks**:
  - All extension builds for all supported PostgreSQL versions
  - Extension test suites
  - Package structure integrity
  - Migration path validity (for multi-version extensions)
  - Integration tests

**Tip**: Run this locally before creating a PR to catch issues early.

---

## Troubleshooting

**Hash mismatch errors**: Make sure you're building with an empty hash first (`hash = "";`), then copy the exact hash from the error output.

**Build failures**: Check that:
- PostgreSQL versions in `versions.json` are correct
- For pgrx extensions: Rust and pgrx versions are compatible
- All required dependencies are listed

**Test failures**: Run with `-L` flag to see detailed logs:
```bash
nix flake check -L 2>&1 | tee build.log
```
