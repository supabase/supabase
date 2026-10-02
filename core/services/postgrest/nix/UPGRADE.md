# Checklist for upgrading Nix dependencies

The Nix dependencies of PostgREST should be updated regularly, in most cases it
should be a very simple operation.

```bash
# Update pinned version of Nixpkgs
nix-shell --run postgrest-nixpkgs-upgrade

# Verify that everything builds
nix-build
```

The following checklist guides you through the complete process in more detail.

## Upgrade the pinned version of `nixpkgs`

The pinned version of [`nixpkgs`](https://github.com/NixOS/nixpkgs) is defined
in [`flake.nix`](../flake.nix). To upgrade it, you can use a small utility
script defined in [`nix/tools/nixpkgsTools.nix`](tools/nixpkgsTools.nix):

```bash
# From the root of the repository, enter nix-shell
nix-shell

# Run the utility script to pin the latest revision in main
postgrest-nixpkgs-upgrade

# Exit the nix-shell with Ctrl-d
```

## Review overlays

Check whether the individual [overlays](overlays) are still required.

## Build everything

Using the PostgREST binary Nix cache is recommended. Install
[Cachix](https://cachix.org/) and run `cachix use postgrest`.

Run `nix-build` in the root directory of the project to build all PostgREST
artifacts. This might take a long time, e.g. when our static GHC version needs
to be rebuilt due to changes to some underlying package. If there are any
errors, this is probably due to one of our patches. Try to fix them and re-run
`nix-build` until everything builds.

## Update the PostgREST binary cache

If you have access to the PostgREST cachix project, you can push the
artifacts that you built locally to the binary cache. This will accelerate the
CI builds and tests, sometimes dramatically. This might sometimes even be
required to avoid build timeouts in CI.

You'll need to login with your token with `cachix authtoken <token>`.

To push all new artifacts to Cachix, run:

```
nix-shell --run postgrest-push-cachix
```

The `postgrest-push-cachix` command will query the nix-store to list all
dependencies and build artifacts of PostgREST. It will then push
everything that is not yet cached to the binary cache.
