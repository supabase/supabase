Nix references and other useful tools:

- **Zero to Nix**: Start here to get your feet wet with how Nix works, and how
  to use Nixpkgs: <https://zero-to-nix.com>

- `nix-installer`: My recommended way to install Nix:
    - <https://github.com/DeterminateSystems/nix-installer>

- Nix manual <https://nixos.org/manual/nix/stable/>:
    - Useful primarily for option and command references

- Flake schema reference <https://nixos.wiki/wiki/Flakes>
    - Useful to know what `flake.nix` is referring to

- Example pull requests for this repo:
    - Adding smoke tests for an extension:
      <https://github.com/supabase/nix-postgres/pull/2>
    - Extension smoke tests, part 2:
      <https://github.com/supabase/nix-postgres/pull/3>
    - Adding an extension and a smoke test at once:
      <https://github.com/supabase/nix-postgres/pull/4/files>
    - Updating an extension to trunk:
      <https://github.com/supabase/nix-postgres/pull/7>
    - Updating an extension to the latest release:
      <https://github.com/supabase/nix-postgres/pull/9>

- Contributing to [nixpkgs](https://github.com/nixos/nixpkgs)
    - Adding a PGRX-powered extension:
      <https://github.com/NixOS/nixpkgs/pull/246803>
    - Adding a normal extension: <https://github.com/NixOS/nixpkgs/pull/249000>
    - Adding new PostgreSQL versions: <https://github.com/NixOS/nixpkgs/pull/249030>

- NixOS Discourse: https://discourse.nixos.org/
    - Useful for community feedback, guidance, and help
- `nix-update`: <https://github.com/Mic92/nix-update>
    - Used in this repository to help update extensions
- pgTAP for testing: <https://pgtap.org/documentation.html>
