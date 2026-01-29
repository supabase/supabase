---
title: 'Realtime Postgres RLS now available on Supabase'
description: 'Realtime database changes are now broadcast to authenticated users, respecting the same PostgreSQL policies that you use for Row Level Security.'
author: oli_rice
author_url: https://github.com/olirice
author_image_url: https://github.com/olirice.png
imgSocial: launch-week-three/realtime-row-level-security-in-postgresql/realtime-row-level-security-in-postgresql-og.png
imgThumb: launch-week-three/realtime-row-level-security-in-postgresql/realtime-row-level-security-in-postgresql-thumb.png
categories:
  - product
tags:
  - launch-week
  - realtime
  - security
date: '2021-12-01'
toc_depth: 3
video: https://www.youtube.com/v/zHvatf2wySI
---

Realtime is a server that listens to changes in your PostgreSQL database and broadcasts the changes to clients through a websocket connection.

Today, we're announcing security improvements to Realtime, where database changes will be broadcast to authenticated users, respecting the same PostgreSQL policies that you use for Row Level Security.

## Demo

<div className="video-container">
  <iframe
    className="video-with-border w-full"
    src="https://www.youtube-nocookie.com/embed/zHvatf2wySI"
    frameBorder="1"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  ></iframe>
</div>

## Overview

Since the first commit of Realtime server back in [September 2019](https://github.com/supabase/realtime/commit/175f649784147af80acfc9ff5be9d160285c76ea),
we've worked hard to improve its usability and scalability.

Until now, Realtime did not adhere to RLS policies and instead broadcast all database changes to all clients.
The unsafe nature of this behavior is the reason why Realtime has been an opt-in feature, and a key reason why we are still in Beta.

As more developers rely on Realtime to receive and send database changes in their apps and services,
security has become a primary concern for us and others in the community who wish to build secure systems with Realtime.

Supabase projects have supported Row Level Security (RLS) for API authorization since our [Auth launch](https://supabase.io/blog/supabase-auth).
In that time, it has quickly become the recommended way to implement authorization.

As we were evaluating possible solutions to improve Realtime security, we looked to our Auth implementation as inspiration for a cohesive security system.

Today, we're updating Realtime to respect PostgreSQL RLS policies, so you can define your security rules once and have them automatically apply everywhere!

Before diving deeper into our Realtime RLS implementation, let's briefly cover how RLS works in PostgreSQL.

## Row Level Security Primer

When you need to control access to individual rows of data, PostgreSQL has you covered with [Row Level Security (RLS) policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).
An RLS policy is a snippet of SQL filtering which users have the authority to create/read/update/delete rows in a table.

For example, the following policy would allow users to select their own rows in a todos table:

```sql hideCopy
create policy todo_select_policy
    on todos for select
    using ( (select auth.uid()) = user_id );
```

which is equivalent to adding

{/* prettier-ignore */}
```sql hideCopy
select *
from todos
where auth.uid() = todos.user_id; -- Policy is implicitly added.
```

to queries.

Check out the [Row Level Security guide](https://supabase.com/docs/guides/auth/row-level-security) for more info on how to use RLS with your project.

## Realtime Design

Our Realtime server receives and decodes binary changes from PostgreSQL logical replication, converts those changes to JSON, and broadcasts them to all connected clients.

### Challenge for RLS

The challenge, when applying row level security to the replication stream is that the visibility of a row may be different for each user subscribed to a database table.

We recognized that to fully secure Realtime in accordance with row level security, a row's visibility must be checked separately for each user on every change.
However, this quickly becomes a performance bottleneck when the number of changes, or number of subscribers, is large.

Since we can't control the number of subscribers or the number of changed records, we instead focused on making the security check for each user on every change as fast as possible.

### Implementation Overview

With these challenges in mind, we upstreamed the security responsibility to the database. Write Ahead Log Realtime Unified Security (WALRUS) exposes a PostgreSQL
function that Realtime server invokes with database changes.

### WALRUS Implementation

[WALRUS](https://github.com/supabase/walrus) inspects each record in the replication change to:

- Identify the source table (e.g. `public.notes`).
- Identify the change's action (INSERT/UPDATE/DELETE/TRUNCATE\*).
- Query the `subscription` table to determine the connected users who are actively subscribed to the source table. The `subscription` table is kept up to date by the Realtime server and tracks all connected users and the tables they are currently subscribed to.
- For each subscriber:
  - Assume the identity of the subscriber.
  - Query the source table to see if the record is visible to that subscriber.
- Report the list of subscribers who are authorized to view the record back to Realtime server.

<small>*Realtime server does not broadcast TRUNCATE changes</small>

**Efficiently Query to Check Access**

To maximize throughput, the query used to evaluate if a row is visible to a subscriber always queries using the tables primary key.

For example:

```sql hideCopy
select exists (select 1 from some_table where id = 806);
```

When more than one subscriber exists, the query is wrapped in a [prepared statement](https://www.postgresql.org/docs/13/sql-prepare.html) to remove the cost of the PostgreSQL
query planner on subsequent calls. The query planner time is frequently 2-3x execution time for simple queries, so this immediately multiplies throughput in the most common cases!

```sql hideCopy
"Planning Time: 0.099 ms"
"Execution Time: 0.051 ms"
```

**Colocation**

Colocating the security engine with subscriber data inside PostgreSQL allows us to avoid significant overhead when applying RLS policies.
Namely, network round-trip latency and I/O bottlenecks are removed while connection overhead is reduced relative to testing each record's visibility by polling the database from a separate process.
Instead, the SQL function only consumes a single connection and performs no network I/O.

### Performance

The throughput performance of the database server is best measured in terms of record processing time. As the number of subscribers to a table grows, the time required to process each record,
and the resultant processing time also grows.

![supabase-realtime-processing-per-subscription](/images/blog/launch-week-three/realtime-row-level-security-in-postgresql/supabase-realtime-processing-per-subscription.png)

<div class="overflow-x-scroll" markdown="block">

| Subscribers          | 1    | 5    | 10   | 25   | 50   | 100  | 250  | 500  | 1,000 | 2,000 | 5,000 | 10,000 |
| -------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ----- | ----- | ----- | ------ |
| Processing Time (ms) | 11.2 | 12.5 | 14.2 | 16.7 | 18.8 | 24.5 | 27.8 | 29.1 | 64.7  | 75.5  | 158.4 | 303.8  |

</div>

## Best Practices for Performance

To get the most out of Realtime row level security, follow these guidelines:

### Disable for public tables

If your data is insensitive or publicly available, such as stock prices listed under NASDAQ, then don't enable row level security!

The fastest security policy is one that doesn't exist :)

### Optimize your policies

If you do need row level security, make sure that your policies are fast.

Remember that your policy is executed _each_ time a query touches the table that the policy is applied to. If your policy is slow, all access to that table will be slow.
Avoid joins within RLS policies when you can, and make sure all filter conditions use an index.

Additionally, keep in mind that if you use joins within an RLS policy, any RLS policies on the tables you're joining to will also be executed in turn, adding to the overall overhead.

### Small primary keys

Keep your primary keys small and efficient.

Use single column primary keys with a fixed field size (integer, uuid, etc.) over text or multi-column indexes.

## Next Steps

Realtime RLS is available today on all existing and new Supabase projects. To get started, upgrade your Supabase JavaScript client to version v1.23.0
and launch your new PostgreSQL database today: [database.new](https://database.new)

## More Postgres resources

- [Implementing "seen by" functionality with Postgres](https://supabase.com/blog/seen-by-in-postgresql)
- [Partial data dumps using Postgres Row Level Security](https://supabase.com/blog/partial-postgresql-data-dumps-with-rls)
- [Postgres Views](https://supabase.com/blog/postgresql-views)
- [Postgres Auditing in 150 lines of SQL](https://supabase.com/blog/audit)
- [Cracking PostgreSQL Interview Questions](https://supabase.com/blog/cracking-postgres-interview)
- [What are PostgreSQL Templates?](https://supabase.com/blog/postgresql-templates)

## Credits

Authored by:

- [Oliver Rice](https://github.com/olirice)
- [Wen Bo Xie](https://github.com/w3b6x9)
