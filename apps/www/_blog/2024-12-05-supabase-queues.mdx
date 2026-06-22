---
title: 'Supabase Queues'
description: Durable Message Queues with Guaranteed Delivery in Postgres
author: ivasilov,oli_rice
imgSocial: launch-week-13/day-4-supabase-queues/og.png
imgThumb: launch-week-13/day-4-supabase-queues/thumb.png
categories:
  - developers
  - postgres
tags:
  - queues
  - postgres
date: '2024-12-05T00:00:02'
toc_depth: 3
launchweek: '13'
---

Today we're releasing [Supabase Queues](/modules/queues), for durable background task processing.

Supabase Queues is a Postgres-native, durable Message Queue with guaranteed delivery, improving the scalability and resiliency of your applications. It's designed to work seamlessly with the entire Supabase platform.

<div className="video-container mb-8">
  <iframe
    className="w-full"
    src="https://www.youtube-nocookie.com/embed/UEwfaElBnZk"
    title="Introducing Supabase Cron"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  />
</div>

<Admonition>

Supabase Queues is built on the [pgmq](https://github.com/tembo-io/pgmq) extension by the team at [Tembo](https://github.com/tembo-io).

It's a Supabase policy to [support existing tools](/docs/guides/getting-started/architecture#support-existing-tools) wherever possible, and the Tembo team have generously licensed their extension with the OSI-compatible [PostgreSQL license](https://github.com/tembo-io/pgmq?tab=PostgreSQL-1-ov-file).

We're very thankful to all the contributors and we look forward to working with the Tembo community.

</Admonition>

## Supabase Queues Features

1. **Postgres Native**: Built on top of the open source `pgmq` database extension, create and manage Queues with any Postgres tooling.
1. **Granular Authorization**: Control client-side consumer access to Queues with API permissions and Row Level Security (RLS) policies.
1. **Guaranteed Message Delivery**: Messages added to Queues are guaranteed to be delivered to your consumers.
1. **Exactly Once Message Delivery**: A Message is delivered exactly once to a consumer within a customizable visibility window.
1. **Queue Management and Monitoring**: Create, manage, and monitor Queues and Messages in the Supabase Dashboard.
1. **Message Durability and Archival**: Messages are stored in Postgres and you can choose to archive them for analytical or auditing purposes.

## Do You Need Queues?

A Queue is used to manage and process tasks asynchronously. Typically, you use a Queue for long-running tasks to ensure that your application is robust.

**For example, sending emails:**

Let's say you want to send a welcome email to a user after they register on your website. Instead of sending the email immediately within the registration process - which could slow down the user's experience - you can place the “email task” into a Queue.A separate email service can then process this task, sending the email without affecting the registration flow. Even better: if the email bounces then the task could "reappear" in the Queue to get processed again.

In this scenario, Queues have improved your application's _performance_ and _resilience_. Other cases include:

- **Process tasks asynchronously**: offload time-consuming operations, like sending emails, processing images, and generating embeddings.
- **Communication between services:** decouple your services by passing messages through a central queue.
- **Load Balancing**: Distribute tasks evenly across multiple workers.

## Creating Queues

Queues can be created in the Dashboard or using SQL / database migrations.

<Admonition>
  For this section we'll focus on the Dashboard. You can refer to the
  [documentation](/docs/guides/queues/api) for SQL.
</Admonition>

### Types of Queues

There are several types of queues available:

<Img
  alt="Queue types"
  src={{
    dark: '/images/blog/launch-week-13/day-4-supabase-queues/queue-types.jpg',
    light: '/images/blog/launch-week-13/day-4-supabase-queues/queue-types-light.jpg',
  }}
/>

**Basic Queues**: Simple, reliable queues with core functionality, ideal for most use cases. Messages are stored and processed within Postgres using standard transactional guarantees.

**Unlogged Queues**: Optimized for performance, unlogged queues avoid writing messages to disk, making them faster but less durable in case of a database crash. Suitable for transient or less critical workloads.

**Partitioned Queues** (coming soon): Designed for high throughput and scalability, partitioned queues distribute messages across multiple partitions, enabling parallel processing and more efficient load handling.

### Queues with Postgres Row-Level Security

Supabase Queues are compatible with Postgres Row-Level Security (RLS), providing fine-grained access control to Messages. RLS Policies restrict which users or roles can insert, select, update, or delete messages in specific queues.

## Adding Messages

Once your Queue is configured you can begin adding Messages.

<Img
  alt="Add a message"
  src={{
    dark: '/images/blog/launch-week-13/day-4-supabase-queues/add-message.jpg',
    light: '/images/blog/launch-week-13/day-4-supabase-queues/add-message-light.jpg',
  }}
/>

### From the Dashboard

Let's create a new Basic Queue and add a Message.

<Img
  alt="Create a queue"
  src={{
    dark: '/images/blog/launch-week-13/day-4-supabase-queues/create-a-queue.jpg',
    light: '/images/blog/launch-week-13/day-4-supabase-queues/create-a-queue-light.jpg',
  }}
/>

<Img
  alt="Add a message"
  src={{
    dark: '/images/blog/launch-week-13/day-4-supabase-queues/add-message.jpg',
    light: '/images/blog/launch-week-13/day-4-supabase-queues/add-message-light.jpg',
  }}
/>

<Img
  alt="Message details"
  src={{
    dark: '/images/blog/launch-week-13/day-4-supabase-queues/add-message-modal.jpg',
    light: '/images/blog/launch-week-13/day-4-supabase-queues/add-message-modal-light.jpg',
  }}
/>

### From the server

If you're [connecting](/docs/guides/database/connecting-to-postgres) to your Postgres database from a server, you can add messages using SQL from any Postgres client:

```sql
select * from pgmq.send(
  queue_name  => 'foo',
  msg         => '{ "hello": "world" }'
);
```

### From the client

We have provided several functions that can be invoked from the [client libraries](/docs#client-libraries) if you need to add messages from a browser or mobile app. For example:

```tsx
import { createClient } from '@supabase/supabase-js'

const url = 'SUPABASE_URL'
const key = 'SUPABASE_ANON_KEY'

const queues = createClient(url, key, {
  db: { schema: 'pgmq_public' },
})

const { data, error } = await queues.rpc('send', {
  queue_name: 'foo',
  message: { hello: 'world' },
})

console.log('Message: ', data)
```

For security, this feature is [disabled by default](#security-and-permissions). There are several functions defined in the `pgmq_public` schema: `send`, `send_batch`, `read`, `pop`, `archive`, `delete`. You can find more details in the [docs](/docs/guides/queues/api).

## Security and Permissions

By default, Queues are only accessible via SQL and not exposed over the Supabase Data API. You can manage this in the Data API settings by [exposing the pgmq_public schema](/docs/guides/api/using-custom-schemas). If you expose this schema, you must use [Row Level Security](/docs/guides/database/postgres/row-level-security) (RLS) to manage access to your queues.

Beyond RLS, Postgres roles can be granted granular permissions to interact with Queues.

For example, the following permissions allow authenticated users can fully manipulate messages, whereas anonymous users can only retrieve messages:

<Img
  alt="Queue permissions"
  src={{
    dark: '/images/blog/launch-week-13/day-4-supabase-queues/permissions.jpg',
    light: '/images/blog/launch-week-13/day-4-supabase-queues/permissions-light.jpg',
  }}
/>

The `postgres` and `service_role` roles receive permissions by default and should remain enabled for server-side operations.

## Monitoring Queues and Messages

You can use the Dashboard to inspect your Messages, including: status, number of retries, and payload. You can also postpone, archive, or delete messages at any time.

From the Queues page, just click on a Queue to inspect it. From there you can click on a message to see more details:

<Img
  alt="Message details"
  src={{
    dark: '/images/blog/launch-week-13/day-4-supabase-queues/message-detail.jpg',
    light: '/images/blog/launch-week-13/day-4-supabase-queues/message-detail-light.jpg',
  }}
/>

## Try Supabase Queues Today

1. Visit the [Integrations page](https://supabase.com/dashboard/project/_/integrations) in your project.
2. Enable the **Queues** Postgres Module.
3. Create your first Queue.

<Img
  alt="Enable queues"
  src={{
    dark: '/images/blog/launch-week-13/day-4-supabase-queues/integrations.jpg',
    light: '/images/blog/launch-week-13/day-4-supabase-queues/integrations-light.jpg',
  }}
/>

## Pricing

Supabase Queues runs entirely in your database so there's no additional costs to use the functionality.

We recommend you configure your database's Compute and Disk settings appropriately to support your Queues workload.

## Postgres for Everything

Using Postgres for your Queue system keeps your stack lean and familiar. You can add Messages to Queues within the same transaction that modifies related data, preventing inconsistencies and reducing the need for additional coordination. Postgres' robust indexing, JSONB support, and partitioning also enable scalable, high-performance queue management directly in your database.

By eliminating the need for separate infrastructure like RabbitMQ or Kafka, you reduce costs, streamline deployments, and leverage existing Postgres tools for monitoring, backups, and security. Features like Row-Level Security, rich SQL querying, and built-in archiving make Postgres a powerful, unified solution for both data storage and messaging.
