PostgreSQL versions are managed in upstream nixpkgs.

[See this example PR](https://github.com/NixOS/nixpkgs/pull/249030) to add a
new version of PostgreSQL; this version is for 16 beta3, but any version is
roughly the same. In short, you need to:

- Add a new version and hash to `nix/config.nix`
- Possibly patch the source code for minor refactorings
  - In this example, an old patch had to be rewritten because a function was
    split into two different functions; the patch is functionally equivalent but
    textually different
- Add the changes to `all-packages.nix`
- Integrate inside the CI and get code review
- Run `nix flake update` to get a new version, once it's ready

## Adding the major version to this repository

It isn't well abstracted, unfortunately. In short: look for the strings `14` and
`15` under the nix configuration files. More specifically:

- Add `psql_XX` to `basePackages` in `nix/packages/postgres.nix`
- Ditto with `checks` in `nix/checks.nix`
- Modify the tools under `nix/packages/` to understand the new major version
- Make sure the CI is integrated under the GitHub Actions.

The third step and fourth steps are the most annoying, really. The first two are
easy and by that point you can run `nix flake check` in order to test the build,
at least.

## Other notes

See also issue [#6](https://github.com/supabase/nix-postgres/issues/6), which
would make it possible to define PostgreSQL versions inside this repository.
