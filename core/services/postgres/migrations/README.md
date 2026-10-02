# Usage

from the root of the `supabase/postgres` project, you can run the following commands:


```shell
Usage: nix run .#dbmate-tool -- [options]

Options:
  -v, --version [15|16|orioledb-17|all]  Specify the PostgreSQL version to use (required defaults to --version all)
  -p, --port PORT                    Specify the port number to use (default: 5435)
  -h, --help                         Show this help message

Description:
  Runs 'dbmate up' against a locally running the version of database you specify. Or 'all' to run against all versions.
  NOTE: To create a migration, you must run 'nix develop' and then 'dbmate new <migration_name>' to create a new migration file.

Examples:
  nix run .#dbmate-tool
  nix run .#dbmate-tool -- --version 15
  nix run .#dbmate-tool -- --version 16 --port 5433

```

This can also be run from a github "flake url" for example:

```shell
nix run github:supabase/postgres#dbmate-tool -- --version 15

or

nix run github:supabase/postgres/mybranch#dbmate-tool -- --version 15
```
# supabase/migrations

`supabase/migrations` is a consolidation of SQL migrations from:

- supabase/postgres
- supabase/supabase
- supabase/cli
- supabase/platform (internal)

aiming to provide a single source of truth for migrations on the platform that can be depended upon by those components. For more information on goals see [the RFC](https://www.notion.so/supabase/Centralize-SQL-Migrations-cd3847ae027d4f2bba9defb2cc82f69a)



## How it was Created

Migrations were pulled (in order) from:

1. [init-scripts/postgres](https://github.com/supabase/platform/tree/develop/init-scripts/postgres) => [db/init-scripts](db/init-scripts)
2. [init-scripts/migrations](https://github.com/supabase/platform/tree/develop/init-scripts/migrations) => [db/migrations](db/migrations)

For compatibility with hosted projects, we include [migrate.sh](migrate.sh) that executes migrations in the same order as ami build:

1. Run all `db/init-scripts` with `postgres` superuser role.
2. Run all `db/migrations` with `supabase_admin` superuser role.
3. Finalize role passwords with `/etc/postgresql.schema.sql` if present.

Additionally, [supabase/postgres](https://github.com/supabase/postgres/blob/develop/ansible/playbook-docker.yml#L9) image contains several migration scripts to configure default extensions. These are run first by docker entrypoint and included in ami by ansible.



## Guidelines

- Migrations are append only. Never edit existing migrations once they are on master.
- Migrations in `migrations/db/migrations` have to be idempotent.
- Self contained components (gotrue, storage, realtime) may contain their own migrations.
- Self hosted Supabase users should update role passwords separately after running all migrations.
- Prod release is done by publishing a new GitHub release on master branch.

## Requirements

- [dbmate](https://github.com/amacneil/dbmate)
- [docker-compose](https://docs.docker.com/compose/)

## Usage

### Add a Migration

First, start a local postgres server in another terminal window:

```shell
# Start the database server in another window
nix run .#start-server 15
```

Then, in your main terminal window, run:

```shell

nix develop
```
in the root of `supabase/postgres`. 

Next run: 
``` shell
# Create a new migration (make sure to specify the migrations directory)
dbmate --migrations-dir="migrations/db/migrations" new '<some message>'
```

Then, execute the migration at `./migrations/db/xxxxxxxxx_<some_message>` and make sure it runs successfully with:

```shell
# Make sure DATABASE_URL is set, or use the -u flag to specify the database connection
# Example with DATABASE_URL:
dbmate --no-dump-schema --migrations-dir="migrations/db/migrations" up

# Or with -u flag:
dbmate --no-dump-schema --migrations-dir="migrations/db/migrations" -u "postgres://supabase_admin:postgres@localhost:5435/postgres?sslmode=disable" up
```

Note: Migrations are applied using the `supabase_admin` superuser role, as specified in the "How it was Created" section above.

### Updating schema.sql for each major version

After making changes to migrations, you should update the schema.sql files for each major version of PostgreSQL:

```shell
# First, stop any running PostgreSQL servers
# Then from the root of supabase/postgres run:
nix run .#dbmate-tool -- --version all
```

This will create automatically  schema.sql file for each major version of PostgreSQL and OrioleDB (the files are named like `schema-<ver>`, `schema-oriole-<ver>`). Commit these changes to your repository and push to your branch. The workflow in `.github/workflows/test.yml`  will re-run this command in CI, and perform a git diff to verify the idempotency of the migrations, and that the latest changes have been committed.

## Testing

In addition to ci test mentioned above, you can test migrations locally by running the following test for each major version of postgres one at a time.

Examples:

```
nix build .#checks.aarch64-darwin.psql_15 -L
nix build .#checks.aarch64-darwin.psql_17 -L
nix build .#checks.aarch64-darwin.psql_orioledb-17 -L
```

(Note that the evaluation and nix build of the postgres packages "bundle" of each major version must succeed here, even though we run one version at a time. If you made changes to postgres or extensions, or wrappers those may rebuild here when you run this. Otherwise they will usually download the prebuilt version from the supabase nix binary cache)

At the end of these commands, you will see the output of both `pg_regress` tests, and migration tests

see [Adding Tests](https://github.com/supabase/postgres/blob/develop/nix/docs/adding-tests.md) for more information.
