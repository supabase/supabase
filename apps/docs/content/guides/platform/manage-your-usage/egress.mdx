---
id: 'manage-usage-egress'
title: 'Manage Egress usage'
---

## What you are charged for

You are charged for the network data transmitted out of the system to a connected client. Egress is incurred by all services - Database, Auth, Storage, Edge Functions, Realtime and Log Drains.

### Database Egress

Data sent to the client when retrieving data stored in your database.

**Example:** A user views their order history in an online shop. The client application requests the database to retrieve the user's past orders. The order data is sent back to the client, contributing to Database Egress.

<Admonition type="note">

There are various ways to interact with your database, such as through the PostgREST API using one of the client SDKs or via the Supavisor connection pooler. On the Supabase Dashboard, Egress from the PostgREST API is labeled as **Database Egress**, while Egress through Supavisor is labeled as **Shared Pooler Egress**.

</Admonition>

### Auth Egress

Data sent from Supabase Auth to the client while managing your application's users. This includes actions like signing in, signing out, or creating new users, e.g. via the JavaScript Client SDK.

**Example:** A user signs in to an online shop. The client application requests the Supabase Auth service to authenticate and authorize the user. The session data, including authentication tokens and user profile details, is sent back to the client, contributing to Auth Egress.

### Storage Egress

Data sent from Supabase Storage to the client when retrieving assets. This includes actions like downloading files, images, or other stored content, e.g. via the JavaScript Client SDK.

**Example:** A user downloads an invoice from an online shop. The client application requests Supabase Storage to retrieve the PDF file from the storage bucket. The file is sent back to the client, contributing to Storage Egress.

### Edge Functions Egress

Data sent to the client when executing Edge Functions.

**Example:** A user completes a checkout process in an online shop. The client application triggers an Edge Function to process the payment and confirm the order. The confirmation response, along with any necessary details, is sent back to the client, contributing to Edge Functions Egress.

### Realtime Egress

Data pushed to clients via Supabase Realtime for subscribed events.

**Example:** When a user views a product page in an online shop, their client subscribes to real-time inventory updates. As stock levels change, Supabase Realtime pushes updates to all subscribed clients, contributing to Realtime Egress.

### Shared pooler Egress

Data sent to the client when using the shared connection pooler (Supavisor) to access your database. When using the shared connection pooler, we do not count database egress, as this would otherwise count double (Database -> Shared Pooler + Shared Pooler -> Client).

**Example:** You are using our [shared connection pooler](/docs/guides/database/connecting-to-postgres#shared-pooler) and you query a list of invoices in your backend. The data returned from that query is contributing to Shared Pooler Egress.

### Log Drain Egress

Data pushed to the connected log drain.

**Example:** You set up a log drain, each log sent to the log drain is considered egress. You can toggle the GZIP option to reduce egress, in case your provider supports it.

### Cached Egress

Cached and uncached egress have independent quotas and independent pricing. Cached egress is egress that is served from our CDN via cache hits. Cached egress is typically incurred for storage through our [Smart CDN](/docs/guides/storage/cdn/smart-cdn).

## How charges are calculated

Egress is charged by gigabyte. Charges apply only for usage exceeding your subscription plan's quota. This quota is called the Unified Egress Quota because it can be used across all services (Database, Auth, Storage etc.).

### Usage on your invoice

Usage is shown as "Egress GB" and "Cached Egress GB" on your invoice.

## Pricing

<Price price="0.09" /> per GB per month for uncached egress, <Price price="0.03" /> per GB per month
for cached egress. You are only charged for usage exceeding your subscription plan's quota.

| Plan       | Egress Quota (Uncached / Cached) | Over-Usage per month (Uncached / Cached)                      |
| ---------- | -------------------------------- | ------------------------------------------------------------- |
| Free       | 5 GB / 5 GB                      | -                                                             |
| Pro        | 250 GB / 250 GB                  | <Price price="0.09" /> per GB / <Price price="0.03" /> per GB |
| Team       | 250 GB / 250 GB                  | <Price price="0.09" /> per GB / <Price price="0.03" /> per GB |
| Enterprise | Custom                           | Custom                                                        |

## Billing examples

### Within quota

The organization's Egress usage is within the quota, so no charges for Egress apply.

| Line Item           | Units     | Costs                    |
| ------------------- | --------- | ------------------------ |
| Pro Plan            | 1         | <Price price="25" />     |
| Compute Hours Micro | 744 hours | <Price price="10" />     |
| Egress              | 200 GB    | <Price price="0" />      |
| Cached Egress       | 230 GB    | <Price price="0" />      |
| **Subtotal**        |           | **<Price price="35" />** |
| Compute Credits     |           | -<Price price="10" />    |
| **Total**           |           | **<Price price="25" />** |

### Exceeding quota

The organization's Egress usage exceeds the uncached egress quota by 50 GB and the cached egress quota by 550 GB, incurring charges for this additional usage.

| Line Item           | Units     | Costs                      |
| ------------------- | --------- | -------------------------- |
| Pro Plan            | 1         | <Price price="25" />       |
| Compute Hours Micro | 744 hours | <Price price="10" />       |
| Egress              | 300 GB    | <Price price="4.5" />      |
| Cached Egress       | 800 GB    | <Price price="16.5" />     |
| **Subtotal**        |           | **<Price price="47.5" />** |
| Compute Credits     |           | -<Price price="10" />      |
| **Total**           |           | **<Price price="37.5" />** |

## View usage

### Usage page

You can view Egress usage on the [organization's usage page](/dashboard/org/_/usage). The page shows the usage of all projects by default. To view the usage for a specific project, select it from the dropdown. You can also select a different time period.

<Image
  alt="Usage page navigation bar"
  src={{
    light: '/docs/img/guides/platform/usage-navbar--light.png',
    dark: '/docs/img/guides/platform/usage-navbar--dark.png',
  }}

width={1546}
height={208}
/>

In the Total Egress section, you can see the usage for the selected time period. Hover over a specific date to view a breakdown by service. Note that this includes the cached egress.

<Image
  alt="Unified Egress"
  src={{
    light: '/docs/img/guides/platform/unified-egress--light.png',
    dark: '/docs/img/guides/platform/unified-egress.png',
  }}

width={803}
height={460}
/>

Separately, you can see the cached egress right below:

<Image
  alt="Unified Egress"
  src={{
    light: '/docs/img/guides/platform/cached-egress--light.png',
    dark: '/docs/img/guides/platform/cached-egress.png',
  }}

width={1422}
height={586}
/>

### Custom report

1. On the [Observability page](/dashboard/project/_/observability), click **New custom report** in the left navigation menu
2. After creating a new report, add charts for one or more Supabase services by clicking **Add block**

<Image
  alt="Egress report"
  src={{
    light: '/docs/img/guides/platform/egress-report--light.png',
    dark: '/docs/img/guides/platform/egress-report--dark.png',
  }}

width={2884}
height={948}
/>

## Debug usage

To better understand your Egress usage, identify what’s driving the most traffic. Check the most frequent database queries, or analyze the most requested API paths to pinpoint high-egress endpoints.

### Frequent database queries

On the Advisors [Query performance view](/dashboard/project/_/database/query-performance?preset=most_frequent&sort=calls&order=desc) you can see the most frequent queries and the average number of rows returned.

<Image
  alt="Most frequent queries"
  src={{
    light: '/docs/img/guides/platform/advisor-most-frequent-queries--light.png',
    dark: '/docs/img/guides/platform/advisor-most-frequent-queries--dark.png',
  }}

width={5006}
height={510}
/>

### Most requested API endpoints

In the [Logs Explorer](/dashboard/project/_/logs/explorer) you can access Edge Logs, and review the top paths to identify heavily queried endpoints. These logs currently do not include response byte data. That data will be available in the future too.

<Image
  alt="Top paths"
  src={{
    light: '/docs/img/guides/platform/logs-top-paths--light.png',
    dark: '/docs/img/guides/platform/logs-top-paths--dark.png',
  }}

width={4492}
height={1166}
/>

## Optimize usage

- Reduce the number of fields or entries selected when querying your database
- Reduce the number of queries or calls by optimizing client code or using caches
- For update or insert queries, configure your ORM or queries to not return the entire row if not needed
- When running manual backups through Supavisor, remove unneeded tables and/or reduce the frequency
- Refer to the [Storage Optimizations guide](/docs/guides/storage/production/scaling#egress) for tips on reducing Storage Egress

## Exceeding Quotas

<$Partial path="billing/exceeding_usage_quotas.mdx" />
