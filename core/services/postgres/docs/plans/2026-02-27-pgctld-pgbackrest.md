# pgctld + pgbackrest in multigres images — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Package `pgctld` (from `github:multigres/multigres`) as a Nix derivation and install both `pgctld` and `pgbackrest` in both multigres Docker image variants (`variant-17` and `variant-orioledb-17`).

**Architecture:** Add `github:multigres/multigres` as a `flake = false` input, build `pgctld` with `buildGoModule` (it is `CGO_ENABLED=0`, pure Go, static), expose as `path:.#pgctld`, and add alongside `pg-backrest` in both nix-builder stages of `Dockerfile-multigres`. The existing per-variant symlink loop in the Dockerfile automatically exposes both binaries at `/usr/bin/` with no further changes.

**Tech Stack:** Nix flakes, `buildGoModule`, Go 1.25 (CGO_ENABLED=0), Alpine 3.21, Dockerfile multi-stage builds.

**Current state of `Dockerfile-multigres`:**
- `nix-builder-17`: already has `pg-backrest` added (partial previous change), needs `pgctld` added
- `nix-builder-orioledb-17`: has neither `pg-backrest` nor `pgctld` yet

---

### Task 1: Add the multigres flake input

**Files:**
- Modify: `flake.nix` (inputs block, after line 33)

**Step 1: Add the two input lines**

In `flake.nix`, inside the `inputs = { ... }` block, add after the existing `nixpkgs-oldstable` line:

```nix
    multigres.url = "github:multigres/multigres";
    multigres.flake = false;
```

**Step 2: Verify flake evaluates**

```bash
cd /Users/samrose/pg-multigres-image
nix flake show 2>&1 | head -20
```

Expected: output lists packages (no eval error). The `multigres` input will appear in `nix flake metadata`.

**Step 3: Commit**

```bash
git add flake.nix
git commit -m "feat: add multigres flake input for pgctld packaging"
```

---

### Task 2: Create nix/packages/pgctld.nix

**Files:**
- Create: `nix/packages/pgctld.nix`

**Step 1: Create the file with fakeHash**

```nix
{ lib, buildGoModule, multigres-src }:
buildGoModule {
  pname = "pgctld";
  version = "0.1.0";
  src = multigres-src;
  subPackages = [ "go/cmd/pgctld" ];
  CGO_ENABLED = "0";
  ldflags = [
    "-w"
    "-s"
  ];
  preBuild = ''
    cp external/pico/pico.* go/common/web/templates/css/ 2>/dev/null || true
  '';
  vendorHash = lib.fakeHash;
}
```

**Step 2: Register it in default.nix (needed to build it)**

In `nix/packages/default.nix`, add this line in the `packages = (` block alongside the existing `pg-backrest` line (around line 63):

```nix
          pgctld = pkgs.callPackage ./pgctld.nix {
            multigres-src = inputs.multigres;
          };
```

**Step 3: Run build to get the real vendorHash**

```bash
nix build .#pgctld 2>&1 | grep "got:"
```

Expected: build **fails** with a line like:
```
         got: sha256-<base64hash>=
```

Copy that full `sha256-...=` value.

**Step 4: Replace fakeHash with real hash**

In `nix/packages/pgctld.nix`, replace:
```nix
  vendorHash = lib.fakeHash;
```
with:
```nix
  vendorHash = "sha256-<the-actual-hash-from-step-3>=";
```

**Step 5: Verify the build succeeds**

```bash
nix build .#pgctld
./result/bin/pgctld --version
```

Expected: binary prints version string (e.g. `pgctld version ...`) and exits 0.
If it prints a version or help text, that's fine — the binary exists and is executable.

**Step 6: Commit**

```bash
git add nix/packages/pgctld.nix nix/packages/default.nix
git commit -m "feat: package pgctld from github:multigres/multigres as Nix derivation"
```

---

### Task 3: Update Dockerfile-multigres — nix-builder-17 stage

**Files:**
- Modify: `Dockerfile-multigres` (line 38)

**Step 1: Add pgctld to the nix-builder-17 profile add**

Current line 38:
```dockerfile
RUN nix profile add path:.#psql_17_slim/bin path:.#pg-backrest
```

Change to:
```dockerfile
RUN nix profile add path:.#psql_17_slim/bin path:.#pg-backrest path:.#pgctld
```

**Step 2: Commit**

```bash
git add Dockerfile-multigres
git commit -m "feat: add pg-backrest and pgctld to multigres nix-builder-17"
```

---

### Task 4: Update Dockerfile-multigres — nix-builder-orioledb-17 stage

**Files:**
- Modify: `Dockerfile-multigres` (line 78)

**Step 1: Add both tools to the nix-builder-orioledb-17 profile add**

Current line 78:
```dockerfile
RUN nix profile add path:.#psql_orioledb-17_slim/bin
```

Change to:
```dockerfile
RUN nix profile add path:.#psql_orioledb-17_slim/bin path:.#pg-backrest path:.#pgctld
```

**Step 2: Commit**

```bash
git add Dockerfile-multigres
git commit -m "feat: add pg-backrest and pgctld to multigres nix-builder-orioledb-17"
```

---

### Task 5: Build and verify variant-17

**Step 1: Build the image**

```bash
docker build -f Dockerfile-multigres --target variant-17 -t multigres-17 .
```

Expected: build completes successfully (all stages).

**Step 2: Verify binaries are present**

```bash
docker run --rm multigres-17 which pgctld
docker run --rm multigres-17 which pgbackrest
docker run --rm multigres-17 pgctld --help 2>&1 | head -5
docker run --rm multigres-17 pgbackrest version
```

Expected:
- `which pgctld` → `/usr/bin/pgctld`
- `which pgbackrest` → `/usr/bin/pgbackrest`
- `pgctld --help` → prints usage
- `pgbackrest version` → prints version

**Step 3: If any binary is missing**

Check the symlink loop output:
```bash
docker run --rm multigres-17 ls -la /nix/var/nix/profiles/default/bin/ | grep -E "pgctld|pgbackrest"
```

If the nix profile binaries exist there but `/usr/bin/` symlinks are missing, the symlink loop in the variant stage silently skipped them — investigate whether the binary names conflict with existing Alpine binaries.

---

### Task 6: Build and verify variant-orioledb-17

**Step 1: Build the image**

```bash
docker build -f Dockerfile-multigres --target variant-orioledb-17 -t multigres-orioledb-17 .
```

Expected: build completes successfully.

**Step 2: Verify binaries are present**

```bash
docker run --rm multigres-orioledb-17 which pgctld
docker run --rm multigres-orioledb-17 which pgbackrest
docker run --rm multigres-orioledb-17 pgctld --help 2>&1 | head -5
docker run --rm multigres-orioledb-17 pgbackrest version
```

Expected: same as Task 5 Step 2.

**Step 3: Commit if any fixes were needed, then final commit**

```bash
git add -p   # stage only what changed
git commit -m "chore: verify pgctld and pgbackrest in both multigres variants"
```

---

## Troubleshooting reference

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| `nix build .#pgctld` fails with "attribute 'multigres' missing" | flake.lock not updated | run `nix flake update multigres` |
| `go build` fails inside nix with "missing generated file" | proto/parser not committed | check `go/pb/` and `go/common/parser/postgres.go` exist (they do — pre-verified) |
| `vendorHash` mismatch | go.sum changed between flake.lock pin and actual repo HEAD | update flake.lock to desired commit then recompute hash |
| Binary present in nix profile but missing from `/usr/bin/` | filename collision with Alpine package | symlink loop uses `2>/dev/null || true`, check `ls /usr/bin/pgctld` manually |
| `preBuild` cp fails | `external/pico/` not in repo (unlikely) | remove the `preBuild` block — pgctld doesn't use web templates |
