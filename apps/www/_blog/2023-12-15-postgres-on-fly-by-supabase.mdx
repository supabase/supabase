---
title: 'Fly Postgres, managed by Supabase'
description: 'A managed Postgres offering developed by Supabase and Fly.io'
launchweek: x
categories:
  - product
tags:
  - launch-week
  - postgres
date: '2023-12-15'
toc_depth: 3
author: inian,paul_copplestone
imgSocial: lwx-supafly/fly-postgres-og.png
imgThumb: lwx-supafly/fly-postgres-thumb.png
---

<Admonition type="deprecation">

Fly Postgres has been deprecated. See [deprecation announcement](https://github.com/orgs/supabase/discussions/33413) for more details.

</Admonition>

We're launching Fly Postgres, a managed Postgres offering by Supabase and [Fly.io](http://Fly.io).

Fly Postgres databases launch on Fly.io's edge computing platform from any of their 37+ locations. You get everything you expect from a Supabase managed database:

- a full-featured Postgres database with [over 40+ extensions](https://github.com/supabase/postgres)
- [pgvector](https://github.com/pgvector/pgvector/) support for [Vector/AI workloads](/docs/guides/ai)
- [Supavisor](/blog/supavisor-postgres-connection-pooler), our Postgres connection pooler
- Daily backups and point-in-time recovery
- [Branching](/docs/guides/platform/branching), [observability](https://github.com/supabase/supabase-grafana), and migrations
- A [dashboard](/blog/studio-introducing-assistant) for managing your database
- Auto-generated Data APIs:
  - [REST](/docs/guides/api) (using [PostgREST](https://postgrest.org))
  - [GraphQL](/docs/guides/graphql) (using [pg_graphql](https://github.com/supabase/pg_graphql/))

This is deployed within the Fly infrastructure, making it the fastest Postgres database for your data intensive applications deployed on Fly.

## Managing expectations

Before you get too excited, this will be a progressive rollout. It turns out that building inter-company integrations is a lot of work when you factor in billing, support handoff, and educating Supabase staff on how to understand [sandwich analogies](https://fly.io/blog/carving-the-scheduler-out-of-our-orchestrator/).

We've been working with a few early testers and we have some bugs to iron out. You can [sign up for the waitlist](https://forms.supabase.com/fly-postgres) if you want to help with testing. We'll accept more testers next month, and we'll communicate more release timelines as soon as we're confident that your data is safe.

## Supabase + Fly = SupaFly?

We're excited about what this partnership means for 2024. Namely, distributing Postgres across the planet. The Firecracker VM gives us some neat ideas for Postgres. Integrating with Fly also puts a bunch of easy-to-spin-up compute resources right next to the database. That sounds like fun.

## Managed vs unmanaged Postgres

Fly's current Postgres offering is [unmanaged](https://fly.io/docs/postgres/getting-started/what-you-should-know). This means that you're responsible for handling scaling, point-in-time backups, replication, major version upgrades, etc. We'll run Fly's _managed_ Postgres, which means that we do all that for you, and you can concentrate on building.

The managed service is built with the [Fly extension API](https://fly.io/docs/reference/extensions_api/) (also used by [Fly Redis](https://fly.io/docs/reference/redis/)).

Testers can launch a Postgres database using the `fly extensions` command:

```markdown
fly extensions supabase create
```

Once the service is stable, it will be swapped for the `postgres` namespace:

```markdown
fly postgres create
```

With Fly Postgres, the database is deployed within Fly infrastructure leading to a much lower latency for data heavy applications.

## Under the hood

Let's dig into the implementation.

### **Working with Fly machines**

Fly Postgres is built on top of [Fly machines](https://fly.io/docs/machines/). Machines are light-weight Firecracker VMs. The Machines API offers substantial control over an application's lifecycle. They can be suspended during inactivity and resumed within a couple of seconds whenever a new request arrives.

We built [fly-admin](https://github.com/supabase/fly-admin), a Typescript wrapper to simplify our interaction with the Fly API. Supabase bundles a few extra services into Postgres, so we prepared a single Docker image which we can pass to the Fly Machines API. Our current build process outputs an AMI for AWS using [Packer](https://www.packer.io/). We re-use parts of that pipeline to build an [All In One Image](https://github.com/supabase/postgres/tree/develop/docker/all-in-one). This image has all the services to run a Supabase project within a single Docker container.

### **Move to multi-cloud**

With this launch, Supabase is officially multi-cloud. We deliberately avoided using AWS's managed services when building Supabase to simplify our multi-cloud transition. These transitions are never simple - even the base primitives offered between cloud providers can vary significantly.

For example, Fly Machines offer a simple method for suspending a VM when it's not in use, transparently resuming it within seconds. This simplifies the process of pausing inactive databases. There is no direct primitive on AWS to achieve this.

On the other hand, we had to work around a few AWS primitives that Fly doesn't provide. Fly machines don't have network-attached storage, so we treat any data in Fly volumes as ephemeral. We run physical backups for all projects running on Fly using WAL-G. Database changes are continuously streamed to S3. When there is a host or volume corruption, we restore the project to a new Fly host using the latest data in S3.

To capture host issues on AWS, we listen to [AWS Health events](https://docs.aws.amazon.com/health/latest/ug/aws-health-concepts-and-terms.html). For Fly, we send the Machine logs to [Logflare](https://logflare.com/) using the [fly-log-shipper](https://github.com/superfly/fly-log-shipper).

In addition to publishing images in AWS's container registry, we publish the All In One image to Fly's Docker registry. This improved the reliability and performance of project launches on Fly.

### **Building the Fly extension**

Fly has an [excellent approach](https://fly.io/docs/reference/extensions_api/) for extending their platform. We added a few routes to our API to provision users and projects and we were on our way.

Fly users can access the Supabase dashboard using their existing Fly credentials. The Supabase API initiates an OAuth flow with Fly to authenticate the user. Our Auth team created a [Fly OAuth provider](https://github.com/supabase/gotrue/pull/1261) to make the integration with our API easier.

## Challenges

We're still working through a few challenges with the Fly team.

### Support for Network Restrictions

The [network restrictions](https://supabase.com/docs/guides/platform/network-restrictions) feature relies on the container receiving the correct IP of the client connecting to it. With our current setup, the container sees the Fly proxy IP instead. Connections run through the Fly proxy, which exposes the Proxy protocol. Postgres can't use this information directly, but we're looking at [making Supavisor proxy-protocol aware](https://github.com/supabase/supavisor).

### Backups within Fly

Fly projects are backed up to AWS S3 as Fly doesn't provide managed Blob storage (yet). This incurs inter-cloud bandwidth fees. Luckily, Fly are working on [Blob Storage](https://fly.io/docs/flyctl/extensions-tigris-list/), watch this space.

## Getting started

Sign up for the preview [here](https://forms.supabase.com/fly-postgres), wait till we allowlist your org, and get started with the [Quickstart](https://supabase.com/docs/guides/platform/fly-postgres#quickstart) in our docs.

Fly organizations will get one free project. We're still working through some of the finer details on billing, but the pricing will remain relatively unchanged from our current [pricing](https://supabase.com/pricing).
