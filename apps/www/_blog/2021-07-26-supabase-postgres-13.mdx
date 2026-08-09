---
title: 'Supabase is now on Postgres 13.3'
description: From today, new Supabase projects will be on a version of Supabase Postgres that runs on Postgres 13.3.
author: angelico_de_los_reyes
author_url: https://github.com/dragarcia
author_image_url: https://github.com/dragarcia.png
imgSocial: pg13/postgres-13-og.jpg
imgThumb: pg13/postgres-13-thumb.jpg
categories:
  - postgres
tags:
  - launch-week
  - database
date: '2021-07-26'
toc_depth: 2
---

From today, new Supabase projects will be on a version of [Supabase Postgres](https://github.com/supabase/postgres) that runs
on [Postgres 13.3](https://www.postgresql.org/about/news/postgresql-13-released-2077/). This won't be the only big change however in this version.
Here are a few other things that have changed under the hood.

## PostgreSQL version 13.3

We've jumped from PostgreSQL 12.0 to PostgreSQL [version 13.3](https://www.postgresql.org/docs/13/release-13-3.html), introducing
significant performance improvements and some great new functionality. Some changes include:

- native [UUID generation](https://www.postgresql.org/docs/13/functions-uuid.html) (!) using `gen_random_uuid`
- a new JSONB [datetime](https://www.postgresql.org/docs/13/functions-json.html) function
- vacuuming indexes in [parallel](https://www.postgresql.org/docs/13/sql-vacuum.html)
- [incremental sorting](https://www.postgresql.org/docs/13/using-explain.html#USING-EXPLAIN-BASICS)
- smaller [btree indexes](https://www.postgresql.org/docs/13/btree-implementation.html#BTREE-DEDUPLICATION)
- improvements to [extended statistics](https://www.postgresql.org/docs/13/planner-stats.html#PLANNER-STATS-EXTENDED)

## Supabase Versioning

Our [Postgres repo](https://github.com/supabase/postgres) has jumped from `0.15.0` to `13.3.0`. From now on, both major and minor versions of
Supabase Postgres will follow PostgreSQL. This makes it much easier to ascertain what version of PostgreSQL is installed. In the situation wherein
there are no updates to PostgreSQL in between releases, the patch version will be bumped up.

## Large System Extensions (LSE) enabled for ARM instances

<small>
  *Disclaimer for self-hosting: This is not available for x86 instances. All instances on the
  Supabase platform have this enabled by default.*
</small>

The recent wave of Graviton 2 instances from AWS introduces support for the Large System Extensions (LSE). This looks to greatly enhance
application performance through atomics, and
[improves locking and synchronization performance across large systems](https://github.com/aws/aws-graviton-getting-started#building-for-graviton-and-graviton2).

### Preliminary Benchmarks

Below is a comparison between the ARM versions of Supabase Postgres `0.15.0` and `13.3.0`. Both are using `m6gd.8xlarge` instances
and follow the PostgreSQL configuration [here](https://www.percona.com/blog/2021/01/22/postgresql-on-arm-based-aws-ec2-instances-is-it-any-good/).
The following configuration of `pgbench` was used.

```bash hideCopy
pgbench -i -s 150
```

Running the benchmark with 2, 4, 8, 16, 64, and 128 clients:

```bash hideCopy
pgbench -P 5 -c {num_clients} -j {num_clients} -T 300 -M prepared postgres
```

![PostgreSQL 13.3 performance](/images/blog/pg13/postgres-13-performance.png)

## Ubuntu 20.04

We have taken the opportunity to upgrade new projects from Ubuntu 18.04 to Ubuntu 20.04. A switch to Ubuntu 20.04 guarantees that the underlying
OS of Supabase Postgres is supported by the Canonical team up until the year 2025 (2023 for Ubuntu 18.04).

## Built from source

Driven by the need to enable LSE, the underlying PostgreSQL in this version was built from the ground up instead of downloaded binaries.
Supabase Postgres can now be easily upgraded whenever a new major or minor version of PostgreSQL is released. When PostgreSQL 14 comes out,
expect Supabase Postgres 14 to quickly follow.

## New Extensions

### `pgRouting`

An extension of PostGIS, [`pgRouting`](https://pgrouting.org/) provides geospatial routing functionality.

More information can be found [here](https://docs.pgrouting.org/latest/en/index.html).

### `wal2json`

Converts WAL output into clean and organized JSON objects.

More information can be found [here](https://github.com/eulerto/wal2json).

## Enhanced security

To help combat brute force attacks, `fail2ban` has now been configured to protect direct connections to Postgres. This applies to both
ports `5432` (PostgreSQL) and `6543` (PgBouncer).

IPs get banned for 10 minutes after three failed attempts, and we'll continue to fine-tune and improve the protections applied to the
database servers based on evolving traffic patterns.

## PostgreSQL bundles

`[Coming Soon]`

Last but not the least, we're diversifying the images of Supabase Postgres available in the AWS and Digital Ocean Marketplaces.

Instead of a single option, we'll soon offer four configurations of PostgreSQL. Each bundle offers functionality for
common use-cases. For example, if you're using Postgres with Serverless functions, you might want to run the PgBouncer bundle. If you want an
HTTP API with your Postgres offering you might want to run the PostgREST bundle.

| `Name`                              | `PostgreSQL` | `PgBouncer` | `PostgREST` |
| ----------------------------------- | ------------ | ----------- | ----------- |
| Supabase Postgres                   | ✅           |             |             |
| Supabase Postgres: PgBouncer Bundle | ✅           | ✅          |             |
| Supabase Postgres: PostgREST Bundle | ✅           |             | ✅          |
| Supabase Postgres: Complete Bundle  | ✅           | ✅          | ✅          |

Each offering will be available for both the `x86` and `arm` architectures.

## Try PostgreSQL 13

Try the new features of PostgreSQL 13.3 today by creating a [new project](https://supabase.com/dashboard/) on Supabase.

## More Postgres resources

- [Realtime Postgres RLS on Supabase](https://supabase.com//blog/realtime-row-level-security-in-postgresql)
- [Implementing "seen by" functionality with Postgres](https://supabase.com/blog/seen-by-in-postgresql)
- [Partial data dumps using Postgres Row Level Security](https://supabase.com/blog/partial-postgresql-data-dumps-with-rls)
- [Postgres Views](https://supabase.com/blog/postgresql-views)
- [Postgres Auditing in 150 lines of SQL](https://supabase.com/blog/postgres-audit)
- [Cracking PostgreSQL Interview Questions](https://supabase.com/blog/cracking-postgres-interview)
- [What are PostgreSQL Templates?](https://supabase.com/blog/postgresql-templates)
