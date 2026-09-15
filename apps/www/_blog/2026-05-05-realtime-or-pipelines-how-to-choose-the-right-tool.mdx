---
title: 'Realtime or Pipelines? How to choose the right tool'
description: 'Both Realtime and Pipelines read changes from your Postgres database using logical replication. But they solve very different problems. Here is how to pick the right one.'
author: eduardo_gurgel, riccardo_busetti
date: '2026-05-05'
categories:
  - developers
tags:
  - realtime
  - postgres
  - pipelines
  - database
imgSocial: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=announcement&layout=horizontal&copy=Realtime+or+Pipelines%0A%5BHow+to+choose+the+right+tool%5D&icon=icon-realtime.svg'
imgThumb: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=ruler&layout=icon-only&copy=Realtime+or+Pipelines%0A%5BHow+to+choose+the+right+tool%5D&icon=icon-realtime.svg'
toc_depth: 2
---

Both [Supabase Realtime](/docs/guides/realtime) and [Supabase Pipelines](/docs/guides/database/replication/pipelines) read changes from your Postgres database. They both use [logical replication](/docs/guides/database/replication) under the hood. They even look similar when you squint. But they solve very different problems, and choosing the wrong one will frustrate you.

This post explains what each product does, how they differ, and when you should pick one over the other.

## Two tools, two jobs

Here is the simplest way to think about it:

- **Realtime** sends database changes to your users' browsers and apps, right now, as they happen. It is built for live experiences.
- **Pipelines** sends database changes in near real time to supported analytical destinations. It is built for reliable data movement.

Realtime answers the question: "How do I show my users what just happened?"

Pipelines answers the question: "How do I get my production data into my analytics warehouse?"

If you mix these up, you will run into problems. We see it happen regularly, and the rest of this post will help you avoid that.

## What Realtime does

[Realtime](/docs/guides/realtime) is three features in one product:

1. [**Broadcast.**](/docs/guides/realtime/broadcast) Send messages between connected clients in real time. No database required. Think cursor positions, typing indicators, or game state.
2. [**Presence.**](/docs/guides/realtime/presence) Track who is online and what they are doing. Also no database required. Think "3 users are editing this document" or "Jane is typing..."
3. [**Postgres Changes.**](/docs/guides/realtime/postgres-changes) Listen to INSERT, UPDATE, and DELETE events on your database tables and deliver them to subscribed clients over WebSocket.

Two of these three features, Broadcast and Presence, can work without any database interaction. Client-to-client Broadcast sends messages purely over WebSocket with nothing stored. However, [Broadcast from Database](/blog/realtime-broadcast-from-database) lets you trigger broadcasts from database changes using triggers, giving you control over which events reach which channels. This matters because Realtime is not just a database change listener. It is a real-time communication layer for your application.

### How Postgres Changes works

When a client subscribes to a table, Realtime uses a PostgreSQL replication slot to read changes from the Write-Ahead Log (WAL). For each change, it checks [Row Level Security (RLS)](/docs/guides/database/postgres/row-level-security) policies against every subscribed user. If a user is authorized to see the change, Realtime sends it over their WebSocket connection.

This is designed for live UI updates. A user inserts a message into a chat table. Other users see it appear instantly. A row updates in a dashboard table. The chart refreshes automatically.

### What Realtime does not guarantee

Realtime's Postgres Changes feature does not guarantee delivery. If a client disconnects for 30 seconds and reconnects, the changes that happened during those 30 seconds are gone. Realtime does not queue them and does not track how far each client has read.

[Broadcast Replay](/blog/realtime-broadcast-replay) offers limited catch-up for Broadcast from Database messages: clients can request up to 25 messages from the last 3 days using a `since` timestamp. But this only works on private channels, only for database-sourced broadcasts, and is currently in public alpha. It is not a general-purpose replay mechanism for all Realtime events.

Postgres Changes uses temporary replication slots. When no clients are subscribed, it stops replicating data entirely. When clients subscribe again, a new slot is created.

The Realtime team built it this way on purpose. Guaranteed delivery requires persistent state tracking, message queuing, and acknowledgment protocols. Those things add latency and complexity that would make Realtime worse at its actual job: delivering live updates as fast as possible.

If another system needs a durable, recoverable copy of selected database data, Realtime is not the right tool.

## What Pipelines does

Pipelines creates managed change-data-capture (CDC) pipelines. A pipeline reads the operations, rows, and columns selected by your Postgres publication and writes them to a supported destination.

Pipelines keeps the current state of selected Postgres data synchronized with a supported destination in near real time. It maps source names and values to destination-compatible representations and retries transient delivery failures.

### How Pipelines works

When you create a pipeline, it connects to your database through a persistent replication slot. First, it performs an initial sync of the existing rows in the publication. It then begins ongoing replication, processing changes in batches. Latency depends on source activity, network conditions, pipeline configuration, and destination throughput.

Row Level Security does not apply to Pipelines. A pipeline can read all rows and columns selected by its publication. Use publication row filters and column lists to limit the replicated data.

Changes are batched and written to your destination. After a restart, the pipeline resumes from its last acknowledged position while Postgres still retains the required WAL. BigQuery supports a limited set of schema changes in beta; other changes require manual handling.

### What Pipelines guarantees

Pipelines uses at-least-once processing. A retry or restart can process the same change more than once, so destination writes must be idempotent. BigQuery uses the replicated source primary key to apply current-state upserts and deletes.

Pipelines uses persistent replication slots. Postgres retains WAL until the pipeline confirms it has been processed, subject to the database's WAL retention limit. If you stop and restart a pipeline while its slot remains valid, it continues from the retained WAL. A long stop can increase disk usage or invalidate the slot; recovering from a lost slot requires a new initial sync.

This is the opposite of Realtime's approach. Pipelines prioritizes durable progress tracking and recovery over millisecond delivery to end users.

## The key differences

### Delivery guarantees

|                         | **Realtime** | **Pipelines**                                       |
| ----------------------- | ------------ | --------------------------------------------------- |
| Guarantee               | Best effort  | At-least-once                                       |
| Disconnected changes    | Not replayed | Read from retained WAL while the slot remains valid |
| Replication slot        | Temporary    | Permanent                                           |
| Resume after disconnect | No           | Yes, while the replication slot remains valid       |

This is the most important difference. Use Pipelines when another system needs a durable, monitored copy of your selected data. Use Realtime when client applications need live updates and can tolerate gaps while disconnected.

### Where data goes

Realtime sends data to client applications over WebSocket connections. Your users' browsers and mobile apps are the destination.

Pipelines sends data to supported analytical systems.

These are fundamentally different targets with fundamentally different needs. Client apps need low latency. Analytical systems need completeness.

### Database dependency

Realtime's Broadcast and Presence features can work without touching the database. You can build an entire collaborative experience (cursors, presence indicators, ephemeral messaging) without writing a single database query. However, Postgres Changes and [Broadcast from Database](/blog/realtime-broadcast-from-database) both require database interaction.

Pipelines is entirely database-driven. Every byte of data it moves comes from your Postgres tables.

### Scale characteristics

Realtime's Broadcast and Presence features are built for high throughput and low latency. They do not run per-subscriber database queries and scale well across many concurrent connections.

Postgres Changes works differently. It processes changes sequentially to maintain ordering. For each change, it runs an RLS authorization check against every subscribed client. With 100 subscribers watching a table, one INSERT generates 100 authorization queries. This is a deliberate design choice that prioritizes correctness and low latency for typical workloads over raw throughput.

Pipelines processes changes in configurable batches with tunable parallelism. It does not need to authorize individual users because it is moving data to a system, not to end users.

## When to use Realtime

Use Realtime when you need to push live updates to your users:

- **Chat applications.** Messages appear instantly for all participants.
- **Collaborative editing.** See other users' cursors and changes in real time.
- **Live dashboards.** Charts and metrics update without page refresh.
- **Notifications.** Alert users when something relevant happens.
- **Multiplayer features.** Synchronize game state or shared experiences.
- **Presence tracking.** Show who is online, who is typing, who is viewing a document.

The common thread: a human is watching and needs to see changes as they happen.

## When to use Pipelines

Use Pipelines when you need reliable data movement to analytical systems:

- **Analytics and reporting.** Move production data to an analytical destination for querying without impacting your production database.
- **Data warehousing.** Replicate your operational data to a columnar format optimized for analytical queries.
- **ML pipelines.** Feed fresh data to training or feature stores without querying production.
- **Workload isolation.** Run heavy analytical queries against your warehouse instead of your production database.

The common thread: a system needs the current state of selected production data in an analytical destination. Pipelines does not automatically create a queryable history of every row version.

## The mistake we see most often

Some developers discover Realtime's Postgres Changes feature and think: "I can use this to replicate data from one system to another." They write 20 lines of code with supabase-js, subscribe to table changes, and pipe them into another system.

It works great in development. It even works fine in production for a while. Then a WebSocket connection drops for a few seconds and data goes missing. Or the subscribing process restarts and misses a batch of changes. Or load spikes and the sequential RLS authorization checks cannot keep up.

The problem is not that Realtime is broken. The problem is that Realtime was not designed for this job.

If you are maintaining a durable copy of database data in another system, use Pipelines. It persists replication progress and resumes from Postgres WAL after reconnecting.

## Can I use both?

Yes. In fact, many applications should.

Consider an e-commerce platform. You might use Realtime to push order status updates to customers in real time ("Your order has shipped!"). At the same time, you use Pipelines to replicate all order data to a supported analytical destination for daily sales reports and trend analysis.

Same database. Same tables. Different tools for different jobs.

Realtime handles the live experience. Pipelines handles the analytical pipeline. Each does what it was designed to do.

## Quick reference

|                     | **Realtime**                                                         | **Pipelines**                                          |
| ------------------- | -------------------------------------------------------------------- | ------------------------------------------------------ |
| Purpose             | Live updates to client apps                                          | Reliable data movement to analytics                    |
| Delivery            | Best effort                                                          | At-least-once                                          |
| Destinations        | Browsers, mobile apps (WebSocket)                                    | Supported analytical destinations                      |
| Replication slot    | Temporary                                                            | Permanent                                              |
| Resume on reconnect | No                                                                   | Yes                                                    |
| Database required   | Only for Postgres Changes and Broadcast from Database                | Yes, always                                            |
| Processing          | Sequential per-change with per-subscriber authorization              | Batched with configurable parallelism                  |
| Latency             | Typically under 100ms                                                | Seconds (batched)                                      |
| Best for            | Human users watching live data                                       | Systems consuming current replicated data              |
| Built with          | Elixir (Phoenix)                                                     | Rust                                                   |
| Open source         | [github.com/supabase/realtime](https://github.com/supabase/realtime) | [Supabase ETL engine](https://github.com/supabase/etl) |

## Getting started

Realtime is available on all Supabase projects. Check out the [Realtime documentation](/docs/guides/realtime) to get started.

Supabase Pipelines is currently in public alpha. Features and behavior may change as we continue developing the product. If Pipelines isn't available for your organization yet, request access through the Supabase Dashboard or contact your account manager. Read the [Pipelines announcement](/blog/introducing-supabase-pipelines) for more details on how it works.
