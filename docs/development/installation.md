Before starting, set up the database where Supavisor will store tenants' data.
The following command will pull a Docker image with PostgreSQL 14 and run it on
port 6432:

```
docker-compose -f ./docker-compose.db.yml up
```

> `Supavisor` stores tables in the `supavisor` schema. The schema should be
> automatically created by the `dev/postgres/00-setup.sql` file. If you
> encounter issues with migrations, ensure that this schema exists.

Next, get dependencies and apply migrations:

```
mix deps.get && mix ecto.migrate --prefix _supavisor --log-migrator-sql
```
