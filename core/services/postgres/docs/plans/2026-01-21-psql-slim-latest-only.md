# PostgreSQL Slim Image (Latest Extensions Only) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a new `psql_17_slim/bin` flake output that includes only the latest version of each PostgreSQL extension, reducing image size by ~40-60%.

**Architecture:** Add a `latestOnly` parameter to extension nix files. When true, only build the latest version instead of all versions. Create new `makePostgresBinSlim` function in postgres.nix that passes this parameter.

**Tech Stack:** Nix, flake-parts

**Estimated size reduction:** ~700MB+ (wrappers alone has 13 versions → 1)

---

## Task 1: Update postgres.nix to Support Slim Builds

**Files:**
- Modify: `nix/packages/postgres.nix`

**Step 1: Add latestOnly parameter to extCallPackage**

In `makeOurPostgresPkgs`, modify the `extCallPackage` call to accept a `latestOnly` parameter:

```nix
# Around line 94, modify makeOurPostgresPkgs to accept latestOnly parameter
makeOurPostgresPkgs =
  version:
  { latestOnly ? false }:
  let
    postgresql = getPostgresqlPackage version;
    extensionsToUse =
      if (builtins.elem version [ "orioledb-17" ]) then
        orioledbExtensions
      else if (builtins.elem version [ "17" ]) then
        dbExtensions17
      else
        ourExtensions;
    extCallPackage = pkgs.lib.callPackageWith (
      pkgs
      // {
        inherit postgresql latestOnly;
        switch-ext-version = extCallPackage ./switch-ext-version.nix { };
        overlayfs-on-package = extCallPackage ./overlayfs-on-package.nix { };
      }
    );
  in
  map (path: extCallPackage path { }) extensionsToUse;
```

**Step 2: Update makePostgresBin to accept latestOnly**

```nix
# Around line 143, modify makePostgresBin
makePostgresBin =
  version:
  { latestOnly ? false }:
  let
    postgresql = getPostgresqlPackage version;
    postgres-pkgs = makeOurPostgresPkgs version { inherit latestOnly; };
    ourExts = map (ext: {
      name = ext.name;
      version = ext.version;
    }) postgres-pkgs;

    pgbin = postgresql.withPackages (_ps: postgres-pkgs);
  in
  pkgs.symlinkJoin {
    inherit (pgbin) name version;
    paths = [
      pgbin
      (makeReceipt pgbin ourExts)
    ];
  };
```

**Step 3: Update makePostgres to accept latestOnly**

```nix
# Around line 172, modify makePostgres
makePostgres =
  version:
  { latestOnly ? false }:
  lib.recurseIntoAttrs {
    bin = makePostgresBin version { inherit latestOnly; };
    exts = makeOurPostgresPkgsSet version;
  };
```

**Step 4: Add slim packages to basePackages**

```nix
# Around line 178
basePackages = {
  psql_15 = makePostgres "15" { };
  psql_17 = makePostgres "17" { };
  psql_orioledb-17 = makePostgres "orioledb-17" { };
};

slimPackages = {
  psql_17_slim = makePostgres "17" { latestOnly = true; };
};
```

**Step 5: Update binPackages to include slim variants**

```nix
# Around line 183
binPackages = lib.mapAttrs' (name: value: {
  name = "${name}/bin";
  value = value.bin;
}) (basePackages // slimPackages);
```

**Step 6: Commit**

```bash
git add nix/packages/postgres.nix
git commit -m "feat(nix): add latestOnly parameter support to postgres.nix"
```

---

## Task 2: Update pgvector.nix (Template Pattern)

**Files:**
- Modify: `nix/ext/pgvector.nix`

This is the template pattern that will be applied to all multi-version extensions.

**Step 1: Add latestOnly parameter to function signature**

```nix
# Line 1-7, add latestOnly parameter
{
  pkgs,
  lib,
  stdenv,
  fetchFromGitHub,
  postgresql,
  latestOnly ? false,
}:
```

**Step 2: Modify version selection to respect latestOnly**

```nix
# After line 21 (after latestVersion = lib.last versions;)
# Replace:
#   packages = builtins.attrValues (
#     lib.mapAttrs (name: value: build name value.hash) supportedVersions
#   );
# With:
versionsToUse = if latestOnly
  then { "${latestVersion}" = supportedVersions.${latestVersion}; }
  else supportedVersions;
packages = builtins.attrValues (
  lib.mapAttrs (name: value: build name value.hash) versionsToUse
);
versionsBuilt = if latestOnly then [ latestVersion ] else versions;
numberOfVersionsBuilt = builtins.length versionsBuilt;
```

**Step 3: Update passthru to reflect actual versions built**

```nix
# Around line 85-91, update passthru
passthru = {
  versions = versionsBuilt;
  numberOfVersions = numberOfVersionsBuilt;
  inherit pname latestOnly;
  version = if latestOnly
    then latestVersion
    else "multi-" + lib.concatStringsSep "-" (map (v: lib.replaceStrings [ "." ] [ "-" ] v) versions);
  pgRegressTestName = "pgvector";
};
```

**Step 4: Commit**

```bash
git add nix/ext/pgvector.nix
git commit -m "feat(ext): add latestOnly support to pgvector"
```

---

## Task 3: Update wrappers/default.nix

**Files:**
- Modify: `nix/ext/wrappers/default.nix`

This is the most complex extension with migration SQL files. Since we don't need migrations for slim, simplify significantly.

**Step 1: Add latestOnly parameter**

```nix
# Line 1-12, add latestOnly parameter
{
  lib,
  stdenv,
  callPackages,
  fetchFromGitHub,
  openssl,
  pkg-config,
  postgresql,
  buildEnv,
  rust-bin,
  git,
  latestOnly ? false,
}:
```

**Step 2: Modify version selection**

```nix
# After line 208 (after latestVersion = lib.last versions;)
versionsToUse = if latestOnly
  then lib.filterAttrs (n: _: n == latestVersion) supportedVersions
  else supportedVersions;
versionsBuilt = if latestOnly then [ latestVersion ] else versions;
numberOfVersionsBuilt = builtins.length versionsBuilt;

# Update packagesAttrSet to use versionsToUse
packagesAttrSet = lib.mapAttrs' (name: value: {
  name = lib.replaceStrings [ "." ] [ "_" ] name;
  value = build name value.hash value.rust value.pgrx;
}) versionsToUse;
```

**Step 3: Simplify postBuild for latestOnly**

```nix
# Around line 229, modify postBuild to skip migrations when latestOnly
postBuild = ''
  create_control_files() {
    {
      echo "default_version = '${latestVersion}'"
      cat $out/share/postgresql/extension/${pname}--${latestVersion}.control
    } > $out/share/postgresql/extension/${pname}.control
  }

  create_lib_files() {
    ln -sfn ${pname}-${latestVersion}${postgresql.dlSuffix} $out/lib/${pname}${postgresql.dlSuffix}
    ${lib.optionalString (!latestOnly) ''
      # Create symlinks for all previously packaged versions to main library
      for v in ${lib.concatStringsSep " " previouslyPackagedVersions}; do
        ln -sfn $out/lib/${pname}${postgresql.dlSuffix} $out/lib/${pname}-$v${postgresql.dlSuffix}
      done
    ''}
  }

  ${lib.optionalString (!latestOnly) ''
    create_migration_sql_files() {
      # ... existing migration logic ...
    }
  ''}

  create_control_files
  create_lib_files
  ${lib.optionalString (!latestOnly) "create_migration_sql_files"}

  # Verify library count matches expected
  ${if latestOnly then ''
    (test "$(ls -A $out/lib/${pname}*${postgresql.dlSuffix} | wc -l)" = "2")
  '' else ''
    (test "$(ls -A $out/lib/${pname}*${postgresql.dlSuffix} | wc -l)" = "${
      toString (numberOfVersions + numberOfPreviouslyPackagedVersions + 1)
    }")
  ''}
'';
```

**Step 4: Update passthru**

```nix
passthru = {
  versions = versionsBuilt;
  numberOfVersions = numberOfVersionsBuilt;
  pname = "${pname}";
  inherit latestOnly;
  version = if latestOnly
    then latestVersion
    else "multi-" + lib.concatStringsSep "-" (map (v: lib.replaceStrings [ "." ] [ "-" ] v) versions);
  packages = packagesAttrSet // {
    recurseForDerivations = true;
  };
};
```

**Step 5: Commit**

```bash
git add nix/ext/wrappers/default.nix
git commit -m "feat(ext): add latestOnly support to wrappers"
```

---

## Task 4: Update pg_graphql/default.nix

**Files:**
- Modify: `nix/ext/pg_graphql/default.nix`

**Step 1: Add latestOnly parameter and modify version selection**

Apply the same pattern as pgvector:
1. Add `latestOnly ? false` to function parameters
2. Create `versionsToUse` filtered by latestOnly
3. Update packages list to use versionsToUse
4. Update passthru

**Step 2: Commit**

```bash
git add nix/ext/pg_graphql/default.nix
git commit -m "feat(ext): add latestOnly support to pg_graphql"
```

---

## Task 5: Update pg_net.nix

**Files:**
- Modify: `nix/ext/pg_net.nix`

Apply the same pattern as pgvector.

**Step 1: Add latestOnly parameter and modify version selection**

**Step 2: Update library count check for latestOnly**

```nix
# In postBuild, update the check
${if latestOnly then ''
  (test "$(ls -A $out/lib/${pname}*${postgresql.dlSuffix} | wc -l)" = "2")
'' else ''
  (test "$(ls -A $out/lib/${pname}*${postgresql.dlSuffix} | wc -l)" = "${
    toString (numberOfVersions + 1)
  }")
''}
```

**Step 3: Commit**

```bash
git add nix/ext/pg_net.nix
git commit -m "feat(ext): add latestOnly support to pg_net"
```

---

## Task 6: Update pgsodium.nix

**Files:**
- Modify: `nix/ext/pgsodium.nix`

Apply the same pattern as pgvector.

**Commit:**
```bash
git add nix/ext/pgsodium.nix
git commit -m "feat(ext): add latestOnly support to pgsodium"
```

---

## Task 7: Update pgaudit.nix

**Files:**
- Modify: `nix/ext/pgaudit.nix`

Apply the same pattern as pgvector.

**Commit:**
```bash
git add nix/ext/pgaudit.nix
git commit -m "feat(ext): add latestOnly support to pgaudit"
```

---

## Task 8: Update pg_jsonschema/default.nix

**Files:**
- Modify: `nix/ext/pg_jsonschema/default.nix`

Apply the same pattern as pgvector.

**Commit:**
```bash
git add nix/ext/pg_jsonschema/default.nix
git commit -m "feat(ext): add latestOnly support to pg_jsonschema"
```

---

## Task 9: Update Remaining Multi-Version Extensions

Apply the same pattern to these extensions (4 or fewer versions each):

**Files:**
- `nix/ext/pg_cron/default.nix`
- `nix/ext/pg_repack.nix`
- `nix/ext/pg_tle.nix`
- `nix/ext/plv8/default.nix`
- `nix/ext/pgsql-http.nix`
- `nix/ext/hypopg.nix`
- `nix/ext/pgmq/default.nix`
- `nix/ext/pgroonga/default.nix`
- `nix/ext/pgrouting/default.nix`
- `nix/ext/vault.nix`
- `nix/ext/rum.nix`
- `nix/ext/postgis.nix`
- `nix/ext/supautils.nix`

For single-version extensions, just add the parameter with no-op behavior:
```nix
latestOnly ? false,  # unused, for API compatibility
```

**Commit:**
```bash
git add nix/ext/
git commit -m "feat(ext): add latestOnly support to remaining extensions"
```

---

## Task 10: Update Dockerfile-17 to Use Slim Package

**Files:**
- Modify: `Dockerfile-17`

**Step 1: Change nix profile add command**

Find the line:
```dockerfile
RUN nix profile add path:.#psql_17/bin
```

Change to:
```dockerfile
RUN nix profile add path:.#psql_17_slim/bin
```

**Step 2: Commit**

```bash
git add Dockerfile-17
git commit -m "feat(docker): use psql_17_slim for smaller image size"
```

---

## Task 11: Test and Verify

**Step 1: Build the slim package**

```bash
nix build .#psql_17_slim/bin
```

Expected: Build succeeds with only latest versions.

**Step 2: Verify extension count**

```bash
ls -la result/lib/*.so | wc -l
```

Expected: Significantly fewer .so files than full build.

**Step 3: Verify receipt.json**

```bash
cat result/receipt.json | jq '.extensions | length'
```

Expected: Same number of extensions, but each with single version.

**Step 4: Build Docker image and compare size**

```bash
nix run .#image-size-analyzer -- --image Dockerfile-17
```

Expected: Total size reduced by 40-60%.

**Step 5: Commit any fixes**

---

## Task 12: Update Documentation

**Files:**
- Modify: `nix/docs/image-size-analyzer-usage.md`

Add section explaining the slim vs full packages:

```markdown
## Package Variants

### Full Package (`psql_17/bin`)
Includes all versions of each extension for migration support.
Use for: Production databases that need `ALTER EXTENSION ... UPDATE`.

### Slim Package (`psql_17_slim/bin`)
Includes only the latest version of each extension.
Use for: CI/CD, testing, new deployments without migration needs.
Typical size savings: 40-60% smaller.
```

**Commit:**
```bash
git add nix/docs/
git commit -m "docs: document slim vs full package variants"
```

---

## Summary

| Task | Files Modified | Estimated Savings |
|------|---------------|-------------------|
| 1 | postgres.nix | - |
| 2 | pgvector.nix | ~100MB |
| 3 | wrappers/default.nix | ~700MB |
| 4 | pg_graphql/default.nix | ~200MB |
| 5 | pg_net.nix | ~150MB |
| 6 | pgsodium.nix | ~50MB |
| 7 | pgaudit.nix | ~30MB |
| 8 | pg_jsonschema/default.nix | ~30MB |
| 9 | Remaining extensions | ~100MB |
| 10 | Dockerfile-17 | - |

**Total estimated savings: 1.2-1.5 GB**
