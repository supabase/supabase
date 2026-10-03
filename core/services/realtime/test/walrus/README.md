# WALRUS regression suite

`pg_regress` tests inherited from [supabase/walrus](https://github.com/supabase/walrus).

They cover the SQL side of Postgres Changes end to end: a real logical replication slot, `wal2json` output, `realtime.apply_rls`, `realtime.subscription_check_filters`, `realtime.is_visible_through_filters`, RLS, column permissions, `selected_columns`, `action_filter` and the filter operators.

## What they run against

The tenant `realtime` schema, built the way a fresh tenant gets it. Nothing here builds the schema independently, so a change to the tenant migrations that breaks Postgres Changes shows up as a diff in `expected/`.

`Realtime.Tenants.Migrations` builds it in one of two ways, and the suite runs in either:

| Mode           | Schema comes from                              | Which tenants get it                                                            |
| -------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| `--dump`       | `priv/repo/tenant_db_dump_<major>.sql`         | every tenant on a supported major (the default, and the common case)            |
| `--migrations` | replaying every migration in that module       | orioledb tenants, where the dump is refused, and any tenant whose dump won't load |

Both modes share one `expected/`: the two schemas are meant to be the same schema, so a mode that diffs is itself the finding. `--migrations` runs the migrations through `dev/scripts/migrate_tenant_db.exs`, so it needs Elixir on the host; `--dump` needs only docker.

`setup.sql` adds the two things the `supabase/postgres` image doesn't already provide: a `for all tables` publication, and the `auth.uid()` a real project has (the image ships an older one that can't see the claims `apply_rls` sets. See the comment in that file).
`fixtures.sql` defines the `walrus` / `polling_query` views and the `norm()`, `clear_wal()`, `seed_uuid()` helpers the tests are written against.

## Running

```bash
mise run walrus                     # whole suite, from the dump
mise run walrus --migrations        # whole suite, from the migrations
mise run walrus test_simple_insert  # one or more tests
mise run walrus --major 15          # a specific Postgres major
```

The image is resolved from `TENANT_DUMP_IMAGES` in `mise.toml`. With no `--major` the newest entry in that list wins.

`POSTGRES_IMAGE` overrides the lot, which is how you reach an image with no committed dump:

```bash
POSTGRES_IMAGE=supabase/postgres:17.9.0.019-orioledb mise run walrus --migrations
```

`test/walrus/run.sh` takes the same arguments and works on its own; the only thing the mise task adds is resolving `POSTGRES_IMAGE`, which the script otherwise leaves to the default in `compose.walrus-db.yml`.

Every run drops what actually happened in `results/` (gitignored). On a failure the diff is printed, and once you've read it and agree the new output is correct:

```bash
cp test/walrus/results/<test>.out test/walrus/expected/<test>.out
```

## Layout

| Path          | Purpose                                                            |
| ------------- | ------------------------------------------------------------------ |
| `sql/`        | one file per test, run in alphabetical order in a shared database  |
| `expected/`   | the psql transcript each test must reproduce, byte for byte        |
| `setup.sql`   | the publication and `auth.uid()` the image doesn't provide          |
| `fixtures.sql`| helper views and functions the tests call                          |
| `run.sh`      | boots the database, builds the schema, drives `pg_regress`         |
| `results/`    | last run's actual output, gitignored                               |

Each test is responsible for its own cleanup (`drop table`, `pg_drop_replication_slot`, `truncate realtime.subscription`) because they all share one database.
