---
title: 'Dedicated IPv4 Address for Ingress'
description: 'Attach an IPv4 address to your database'
subtitle: 'Attach an IPv4 address to your database'
---

The Supabase IPv4 add-on provides a dedicated IPv4 address for your Postgres database connection. It can be configured in the [Add-ons Settings](/dashboard/project/_/settings/addons).

## Understanding IP addresses

The Internet Protocol (IP) addresses devices on the internet. There are two main versions:

- **IPv4**: The older version, with a limited address space.
- **IPv6**: The newer version, offering a much larger address space and the future-proof option.

## When you need the IPv4 add-on:

<Admonition type="caution">

IPv4 addresses are guaranteed to be static for ingress traffic. If your database is making outbound connections, the outbound IP address is not static and cannot be guaranteed.

</Admonition>

- When using the direct connection string in an IPv6-incompatible network instead of Supavisor or client libraries.
- When you need a dedicated IP address for your direct connection string

## Enabling the IPv4 add-on

You can enable the IPv4 add-on in your project's [add-ons settings](/dashboard/project/_/settings/addons).

You can also manage the IPv4 add-on using the Management API:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Get current IPv4 add-on status
curl -X GET "https://api.supabase.com/v1/projects/$PROJECT_REF/billing/addons" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"

# Enable IPv4 add-on
curl -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/addons" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "addon_type": "ipv4"
  }'

# Disable IPv4 add-on
curl -X DELETE "https://api.supabase.com/v1/projects/$PROJECT_REF/billing/addons/ipv4" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

<Admonition type="caution">

Note that direct database connections can experience a short amount of downtime when toggling the add-on due to DNS reconfiguration and propagation. Generally, this should be less than a minute.

</Admonition>

## Read replicas and IPv4 add-on

When using the add-on, each database (including read replicas) receives an IPv4 address. Each replica adds to the total IPv4 cost.

## Changes and updates

- While the IPv4 address generally remains the same, actions like pausing/unpausing the project or enabling/disabling the add-on can lead to a new IPv4 address.

## Supabase and IPv6 compatibility

By default, Supabase Postgres use IPv6 addresses. If your system doesn't support IPv6, you have the following options:

1. **Supavisor Connection Strings**: The Supavisor connection strings are IPv4-compatible alternatives to direct connections
2. **Supabase Client Libraries**: These libraries are compatible with IPv4
3. **Dedicated IPv4 Add-On (Pro Plans+)**: For a guaranteed IPv4 and static database address for the direct connection, enable this paid add-on.

### Checking your network IPv6 support

You can check if your personal network is IPv6 compatible at https://test-ipv6.com.

### Checking platforms for IPv6 support:

The majority of services are IPv6 compatible. However, there are a few prominent ones that only accept IPv4 connections:

- [Retool](https://retool.com/)
- [Vercel](https://vercel.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Render](https://render.com/)

## Finding your database's IP address

Use an IP lookup website or this command (replace `<PROJECT_REF>`):

```sh
nslookup db.<PROJECT_REF>.supabase.co
```

## Identifying your connections

The pooler and direct connection strings can be found in the [project connect page](/dashboard/project/_?showConnect=true):

#### Direct connection

IPv6 unless IPv4 Add-On is enabled

```sh
# Example direct connection string
postgresql://postgres:[YOUR-PASSWORD]@db.ajrbwkcuthywfihaarmflo.supabase.co:5432/postgres
```

#### Supavisor in transaction mode (port 6543)

Always uses an IPv4 address

```sh
# Example transaction string
postgresql://postgres.ajrbwkcuthywddfihrmflo:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

#### Supavisor in session mode (port 5432)

Always uses an IPv4 address

```sh
# Example session string
postgresql://postgres.ajrbwkcuthywfddihrmflo:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

<$Show if="billing:all">
<$Partial path="billing/pricing/pricing_ipv4.mdx" />
</$Show>
