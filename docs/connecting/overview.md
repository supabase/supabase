To connect to a tenant database Supavisor needs to look up the tenant with an
`external_id`.

You can connect to Supavisor just like you connect to Postgres except we need to
include the `external_id` in the connection string.

Supavisor parses the `external_id` from a connection in one three ways:

- The username
- Server name identification
- `options` parameters

> 📘 Examples
>
> In the following examples our `external_id` is `dev_tenant`.

## Username

Include the `external_id` in the username. The `external_id` is found after
the `.` (dot) in the username:

```
psql postgresql://postgres.dev_tenant:postgres@localhost:6543/postgres
```

## Server name indication

The subdomain of the SNI from the TLS handshake:

```
dev_tenant.supabase.co
```

## Options parameters

Include the `external_id` as the `reference` in the `options` parameters:

```
psql postgresql://postgres:postgres@localhost:6543/postgres&options=reference%3Ddev_tenant
```
