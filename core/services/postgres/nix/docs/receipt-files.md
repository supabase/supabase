# Receipt Files

Every time you run `nix build` on this repository to build PostgreSQL, the
installation directory comes with a _receipt_ file that tells you what's inside
of it. Primarily, this tells you:

- The version of PostgreSQL,
- The installed extensions, and
- The version of nixpkgs.

The intent of the receipt file is to provide a mechanism for tooling to
understand installation directories and provide things like upgrade paths or
upgrade mechanisms.

## Example receipt

For example:

```
nix build .#psql_15.bin
```

```
austin@GANON:~/work/nix-postgres$ nix build .#psql_15.bin
austin@GANON:~/work/nix-postgres$ ls result
bin  include  lib  receipt.json  share
```

The receipt is in JSON format, under `receipt.json`. Here's an example of what
it would look like:

```json
{
  "extensions": [
    {
      "name": "pgsql-http",
      "version": "1.5.0"
    },
    {
      "name": "pg_plan_filter",
      "version": "unstable-2021-09-23"
    },
    {
      "name": "pg_net",
      "version": "0.7.2"
    },
    {
      "name": "pg_hashids",
      "version": "unstable-2022-09-17"
    },
    {
      "name": "pgsodium",
      "version": "3.1.8"
    },
    {
      "name": "pg_graphql",
      "version": "unstable-2023-08-01"
    },
    {
      "name": "pg_stat_monitor",
      "version": "1.0.1"
    },
    {
      "name": "pg_jsonschema",
      "version": "unstable-2023-07-23"
    },
    {
      "name": "vault",
      "version": "0.2.9"
    },
    {
      "name": "hypopg",
      "version": "1.3.1"
    },
    {
      "name": "pg_tle",
      "version": "1.0.4"
    },
    {
      "name": "supabase-wrappers",
      "version": "unstable-2023-07-31"
    },
    {
      "name": "supautils",
      "version": "1.7.3"
    }
  ],
  "nixpkgs": {
    "extensions": [
      {
        "name": "postgis",
        "version": "3.3.3"
      },
      {
        "name": "pgrouting",
        "version": "3.5.0"
      },
      {
        "name": "pgtap",
        "version": "1.2.0"
      },
      {
        "name": "pg_cron",
        "version": "1.5.2"
      },
      {
        "name": "pgaudit",
        "version": "1.7.0"
      },
      {
        "name": "pgjwt",
        "version": "unstable-2021-11-13"
      },
      {
        "name": "plpgsql_check",
        "version": "2.3.4"
      },
      {
        "name": "pg-safeupdate",
        "version": "1.4"
      },
      {
        "name": "timescaledb",
        "version": "2.11.1"
      },
      {
        "name": "wal2json",
        "version": "2.5"
      },
      {
        "name": "plv8",
        "version": "3.1.5"
      },
      {
        "name": "rum",
        "version": "1.3.13"
      },
      {
        "name": "pgvector",
        "version": "0.4.4"
      },
      {
        "name": "pg_repack",
        "version": "1.4.8"
      },
      {
        "name": "pgroonga",
        "version": "3.0.8"
      }
    ],
    "revision": "750fc50bfd132a44972aa15bb21937ae26303bc4"
  },
  "psql-version": "15.3",
  "receipt-version": "1",
  "revision": "vcs=d250647+20230814"
}
```
