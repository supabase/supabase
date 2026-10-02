# Update Nix Dependencies

This document explains how to update various dependencies used in the nix configuration.

## Updating Packer

Packer is used for creating machine images and is defined in `nix/packages/packer.nix`.

### Steps to update Packer version:

1. Create a branch off of `develop`
2. Navigate to `nix/packages/packer.nix`
3. Update the version field:
   ```nix
   version = "1.15.0"; # Update to desired version
   ```
4. Update the git revision to match the new version:
   ```nix
   rev = "v${version}";
   ```
5. Temporarily clear the hash to get the new SHA256:
   ```nix
   hash = ""; # Clear this temporarily
   ```
6. Save the file and run:
   ```bash
   nix build .#packer
   ```
7. Nix will fail and output the correct SHA256 hash. Copy this hash and update the file:
   ```nix
   hash = "sha256-NEWHASHHEREFROMBUILDOUTPUT";
   ```
8. Update the vendorHash if needed. If the build fails due to vendor hash mismatch, temporarily set:
   ```nix
   vendorHash = ""; # Clear this temporarily
   ```
9. Run `nix build .#packer` again to get the correct vendorHash, then update:
   ```nix
   vendorHash = "sha256-NEWVENDORHASHHEREFROMBUILDOUTPUT";
   ```
10. Verify the build works:
    ```bash
    nix build .#packer
    ```
11. Test the packer binary:
    ```bash
    ./result/bin/packer version
    ```
12. Run the full test suite to ensure nothing is broken:
    ```bash
    nix flake check -L
    ```
13. Commit your changes and create a PR for review
14. Update any CI/CD workflows or documentation that reference the old Packer version

### Notes:
- Always check the [Packer changelog](https://github.com/hashicorp/packer/releases) for breaking changes
- Packer uses Go, so ensure compatibility with the Go version specified in the flake inputs
- The current Go version is specified in `flake.nix` under `nixpkgs-go124` input
- If updating to a major version, test all packer templates (`.pkr.hcl` files) in the repository

## Updating Other Dependencies

Similar patterns can be followed for other dependencies defined in the nix packages. Always:

1. Check for breaking changes in changelogs
2. Update version numbers and hashes
3. Run local tests
4. Verify functionality before creating PR
