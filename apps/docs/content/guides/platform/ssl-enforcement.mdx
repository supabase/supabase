---
title: 'Postgres SSL Enforcement'
description: 'Enforce SSL usage for all Postgres connections'
---

Your Supabase project supports connecting to the Postgres DB without SSL enabled to maximize client compatibility. For increased security, you can prevent clients from connecting if they're not using SSL.

Disabling SSL enforcement only applies to connections to Postgres and Supavisor ("Connection Pooler"); all HTTP APIs offered by Supabase (e.g., PostgREST, Storage, Auth) automatically enforce SSL on all incoming connections.

<Admonition type="caution">

Applying or updating SSL enforcement triggers a fast database reboot. On small projects this usually completes in a few seconds, but larger databases may see a longer interruption.

</Admonition>

## Manage SSL enforcement via the dashboard

SSL enforcement can be configured via the "Enforce SSL on incoming connections" setting under the SSL Configuration section in [Database Settings page](/dashboard/project/_/database/settings) of the dashboard.

<Admonition type="note">

Updating SSL enforcement requires a brief database reboot. This restarts only the database and involves a few minutes of downtime.

</Admonition>

## Manage SSL enforcement via the Management API

You can also manage SSL enforcement using the Management API:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Get current SSL enforcement status
curl -X GET "https://api.supabase.com/v1/projects/$PROJECT_REF/ssl-enforcement" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"

# Enable SSL enforcement
curl -X PUT "https://api.supabase.com/v1/projects/$PROJECT_REF/ssl-enforcement" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestedConfig": {
      "database": true
    }
  }'

# Disable SSL enforcement
curl -X PUT "https://api.supabase.com/v1/projects/$PROJECT_REF/ssl-enforcement" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestedConfig": {
      "database": false
    }
  }'
```

## Manage SSL enforcement via the CLI

To get started:

1. [Install](/docs/guides/cli) the Supabase CLI 1.37.0+.
1. [Log in](/docs/guides/getting-started/local-development#log-in-to-the-supabase-cli) to your Supabase account using the CLI.
1. Ensure that you have [Owner or Admin permissions](/docs/guides/platform/access-control#manage-team-members) for the project that you are enabling SSL enforcement.

### Check enforcement status

You can use the `get` subcommand of the CLI to check whether SSL is currently being enforced:

```bash
supabase ssl-enforcement --project-ref {ref} get --experimental
```

Response if SSL is being enforced:

```bash
SSL is being enforced.
```

Response if SSL is not being enforced:

```bash
SSL is *NOT* being enforced.
```

### Update enforcement

The `update` subcommand is used to change the SSL enforcement status for your project:

```bash
supabase ssl-enforcement --project-ref {ref} update --enable-db-ssl-enforcement --experimental
```

Similarly, to disable SSL enforcement:

```bash
supabase ssl-enforcement --project-ref {ref} update --disable-db-ssl-enforcement --experimental
```

### A note about Postgres SSL modes

Postgres supports [multiple SSL modes](https://www.postgresql.org/docs/current/libpq-ssl.html#LIBPQ-SSL-PROTECTION) on the client side. These modes provide different levels of protection. Depending on your needs, it is important to verify that the SSL mode in use is performing the required level of enforcement and verification of SSL connections.

The strongest mode offered by Postgres is `verify-full` and this is the mode you most likely want to use when SSL enforcement is enabled. To use `verify-full` you will need to download the Supabase CA certificate for your database. The certificate is available through the dashboard under the SSL Configuration section in the [Database Settings page](/dashboard/project/_/database/settings).

Once the CA certificate has been downloaded, add it to the certificate authority list used by Postgres.

```bash
cat {location of downloaded prod-ca-2021.crt} >> ~/.postgres/root.crt
```

With the CA certificate added to the trusted certificate authorities list, use `psql` or your client library to connect to Supabase:

```bash
psql "postgresql://aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=verify-full" -U postgres.<user>
```
