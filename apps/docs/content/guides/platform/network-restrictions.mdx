---
id: 'network-restrictions'
title: 'Network Restrictions'
description: "Apply network restrictions for your project's database."
---

This topic explains how to configure network restrictions for your Supabase project's database. Network restrictions let you control which IP ranges can connect to Postgres and its pooler, reducing your project's exposure to unauthorized access.

<Admonition type="note">

If you can't find the Network Restrictions section in your [Database Settings](/dashboard/project/_/database/settings), update your Postgres version in [Infrastructure Settings](/dashboard/project/_/settings/infrastructure).

</Admonition>

Each Supabase project supports configurable restrictions on the IP ranges allowed to connect to Postgres and its pooler. These restrictions are enforced before traffic reaches your database. Connections that aren't restricted by IP still need to authenticate with valid database credentials.

If direct connections to your database [resolve to an IPv6 address](/dashboard/project/_/database/settings), add both IPv4 and IPv6 CIDRs to your allowlist. Network restrictions apply to all connection routes, whether pooled or direct. There are two exceptions: if you have an extension on the IPv6 migration, or if you have the [IPv4 add-on](/dashboard/project/_/settings/addons), you only need to add IPv4 CIDRs.

## Configure with the dashboard [#to-get-started-via-the-dashboard]

To configure network restrictions with the dashboard:

1. Open your project's [Database Settings](/dashboard/project/_/database/settings) page.
1. In the Network Restrictions section, make your changes. You need [Owner or Admin permissions](/docs/guides/platform/access-control#manage-team-members) to make changes.

## Configure with the CLI [#to-get-started-via-the-cli]

To configure network restrictions with the CLI:

1. [Install](/docs/guides/cli) the Supabase CLI 1.22.0+.
1. [Log in](/docs/guides/cli/local-development#log-in-to-the-supabase-cli) to your Supabase account.
1. If your project was created before December 23, 2022, [upgrade it to the latest Supabase version](/docs/guides/platform/migrating-and-upgrading-projects) before using network restrictions.
1. Ensure you have [Owner or Admin permissions](/docs/guides/platform/access-control#manage-team-members) for the project.

### Check restrictions

To check your current network restrictions:

1. Complete the steps in [Configure with the CLI](#to-get-started-via-the-cli).
1. Run the `get` subcommand to retrieve the restrictions currently in effect:

   ```bash
   > supabase network-restrictions get --project-ref {ref} --experimental
   DB Allowed IPv4 CIDRs: &[183.12.1.1/24]
   DB Allowed IPv6 CIDRs: &[2001:db8:3333:4444:5555:6666:7777:8888/64]
   Restrictions applied successfully: true
   ```

   If restrictions have never been applied, the allowed CIDRs list is empty and `Restrictions applied successfully` is `false`. All IPs can connect:

   ```bash
   > supabase network-restrictions get --project-ref {ref} --experimental
   DB Allowed IPv4 CIDRs: []
   DB Allowed IPv6 CIDRs: []
   Restrictions applied successfully: false
   ```

### Update restrictions

To update your network restrictions:

1. Complete the steps in [Configure with the CLI](#to-get-started-via-the-cli).
1. Run the `update` subcommand with the CIDRs you want to allow:

   ```bash
   > supabase network-restrictions update --project-ref {ref} --db-allow-cidr 183.12.1.1/24 --db-allow-cidr 2001:db8:3333:4444:5555:6666:7777:8888/64 --experimental
   DB Allowed IPv4 CIDRs: &[183.12.1.1/24]
   DB Allowed IPv6 CIDRs: &[2001:db8:3333:4444:5555:6666:7777:8888/64]
   Restrictions applied successfully: true
   ```

   The CIDRs you provide replace any previously applied restrictions. To keep existing restrictions, include them alongside any new CIDRs in the `update` command.

### Append a CIDR to existing restrictions

To append a CIDR to your existing restrictions:

1. Complete the steps in [Configure with the CLI](#to-get-started-via-the-cli).
1. Run the `update` subcommand with the `--append` flag to add a CIDR without replacing existing restrictions:

   ```bash
   > supabase network-restrictions update --project-ref {ref} --db-allow-cidr 1.2.3.4/32 --append --experimental
   DB Allowed IPv4 CIDRs: &[183.12.1.1/24 1.2.3.4/32]
   DB Allowed IPv6 CIDRs: &[2001:db8:3333:4444:5555:6666:7777:8888/64]
   Restrictions applied successfully: true
   ```

### Remove restrictions

To remove all network restrictions:

1. Complete the steps in [Configure with the CLI](#to-get-started-via-the-cli).
1. Run the `update` subcommand with the CIDR `0.0.0.0/0` to remove all restrictions:

   ```bash
   > supabase network-restrictions update --project-ref {ref} --db-allow-cidr 0.0.0.0/0 --db-allow-cidr ::/0 --experimental
   DB Allowed IPv4 CIDRs: &[0.0.0.0/0]
   DB Allowed IPv6 CIDRs: &[::/0]
   Restrictions applied successfully: true
   ```

## Limitations

- Network restrictions apply to Postgres and the database pooler. They don't apply to HTTPS APIs such as PostgREST, Storage, and Auth, or to Supabase client libraries like [supabase-js](/docs/reference/javascript).
- With network restrictions applied, Edge functions lose direct access to the database. Use [supabase-js](/docs/reference/javascript) to connect to the database from Edge Functions instead.
