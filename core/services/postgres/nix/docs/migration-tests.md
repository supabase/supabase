Migration tests are run similar to running the client and server; see
[more on that here](./start-client-server.md).

Instead, you use the following format to specify the upgrade:

```
nix run .#migration-test <from> <to> [pg_dumpall|pg_upgrade]
```

The arguments are:

- The version to upgrade from
- The version to upgrade to
- The upgrade mechanism: either `pg_dumpall` or `pg_upgrade`

## Specifying the version

The versions for upgrading can be one of two forms:

- A major version number, e.g. `15` or `17`
- A path to `/nix/store`, which points to _any_ version of PostgreSQL, as long
  as it has the "expected" layout and is a postgresql install.

## Always use the latest version of the migration tool

Unlike the method for starting the client or server, you probably always want to
use the latest version of the `migration-test` tool from the repository. This is
because it can ensure forwards and backwards compatibility if necessary.

## Upgrading between arbitrary `/nix/store` versions

If you want to test migrations from arbitrary versions built by the repository,
you can combine `nix build` and `nix run` to do so. You can use the syntax from
the runbook on [running the server & client](./start-client-server.md) to refer
to arbitrary git revisions.

For example, if you updated an extension in this repository, and you want to
test a migration from PostgreSQL 15 to PostgreSQL 15 + (updated extension),
using `pg_upgrade` &mdash; simply record the two git commits you want to
compare, and you could do something like the following:

```
OLD_GIT_VERSION=...
NEW_GIT_VERSION=...

nix run github:supabase/postgres#migration-test \
  $(nix build --print-out-paths --no-link "github:supabase/postgres/$OLD_GIT_VERSION#psql_15/bin") \
  $(nix build --print-out-paths --no-link "github:supabase/postgres/$NEW_GIT_VERSION#psql_15/bin") \
  pg_upgrade
```
