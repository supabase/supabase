Migrating from PgBouncer is straight forward once a Supavisor cluster is setup
and a database has been added as a `tenant`.

No application level code changes should be required other than a connection
string change. Both `transaction` and `session` pool mode behavior for Supavisor
is the same as PgBouncer.

One caveat during migration is running two connection poolers at the same time.

When rolling out a connection string change to your application you will
momentarily need to support two connection pools to Postgres.

## Check Postgres connection limit

Lets see what our connection limit is set to on our Postgres database:

```sql
show max_connections;
```

## Check used connections

Lets see how many connections we're currently using:

```sql
select count(*) from pg_stat_activity;
```

## Change Postgres `max_connections`

Based on the responses above configure the `default_pool_size` accordingly or
increase your `max_connections` limit on Postgres to accommodate two connection
poolers.

e.g if you're using 30 connections out of 100 and you set your
`default_pool_size` to 20 you have enough connections to run a new Supavisor
pool along side your PgBouncer pool.

If you are using 90 connections out of 100 and your `default_pool_size` is set
to 20 you will have problems during the deployment of your Supavisor connection
string because you will hit your Postgres `max_connections` limit.

## Verify Supavisor connections

Once we've got Supavisor started we can verify it's using the amount of
connections we set for `default_pool_size`:

```sql
SELECT
  COUNT(*) as count,
  usename,
  application_name
FROM pg_stat_activity
WHERE application_name ILIKE '%Supavisor%'
GROUP BY
  usename,
  application_name
ORDER BY application_name DESC;
```

## Celebrate!

You deserve it 🤙
