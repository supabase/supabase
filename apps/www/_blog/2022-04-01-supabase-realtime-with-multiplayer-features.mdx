---
title: Supabase Realtime, with Multiplayer Features
description: Today we're announced Realtime, with multiplayer features. Realtime enables broadcast, presence, and listening to database changes delivered over WebSockets.
author: wenbo
imgSocial: launch-week-4/friday-realtime/multiplayer-realtime-thumb.png
imgThumb: launch-week-4/friday-realtime/multiplayer-realtime-thumb.png
categories:
  - product
tags:
  - launch-week
  - realtime
date: '2022-04-01T22:30:00'
toc_depth: 3
video: https://www.youtube.com/v/BelYEMJ2N00
---

Today is the 1st of April, or April Fool's Day, but I like to think of today as Supabase Realtime Day where we announce and demo the next version of Realtime.

Here's the next version of Realtime, with multiplayer features.

<div className="video-container">
  <iframe
    className="w-full video-with-border"
    src="https://www.youtube-nocookie.com/embed/BelYEMJ2N00"
    frameBorder="1"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  ></iframe>
</div>

We've made quite a few iterations on Realtime in the past. The first major version of Realtime listened to a single database by streaming changes from PostgreSQL's Write-Ahead Log and sending them to clients via WebSockets. The second major version introduced better security via WALRUS (Write Ahead Log Realtime Unified Security) which adheres to a database's RLS policies to determine authorized clients. However, this version continues to be single tenant as it can only poll one database at a time.

The next and third major version, announced today on new Supabase Realtime Day, introduces multi-tenancy to listen to many databases. Additionally, this new version introduces a distributed cluster of nodes, which introduces better resource utilization, fault-tolerance, and lower latencies that directly translates to better performance for developers. We're fortunate to have built Realtime on Elixir and Phoenix, as the language and framework are great for concurrency, distributed computing, and WebSockets. We'll continue to support the existing Realtime feature of listening to database changes, but now we're also introducing the ability for developers to use WebSockets to build multiplayer games, collaborative apps, and support a wide array of use cases.

## New Features

### Presence

![realtime-multiplayer-presence.png](/images/blog/launch-week-4/friday-realtime/realtime-multiplayer-presence.png)

Presence is great for showing when your users are online. When a user connects or disconnects (even accidentally!), the server automatically detects this and let's everyone else know.
Presence is powered by [CRDTs](https://crdt.tech/) (Conflict-free Replicated Data Type) on a distributed cluster useful for storing synced data across nodes.

### Broadcast

![realtime-multiplayer-broadcast.png](/images/blog/launch-week-4/friday-realtime/realtime-multiplayer-broadcast.png)

Broadcasts are perfect for sending ephemeral events, like cursor movements. It's incredibly useful for gaming where you need to send messages across all connected users without storing them in the database.
In Realtime, connected users communicate with other subscribing & publishing to topics.

### Extensions

In this version of Realtime we're re-architecting the way that we listen to PostgreSQL databases by opening the WebSocket functionality for general use.
Instead of only using WebSockets to broadcast database changes, we are now moving the PostgreSQL listener to an “extension” architecture. This opens up numerous new ways of extending the server.
Here are just a few that we've heard:

- Multiple Postgres: listen to multiple PostgreSQL databases at the same time.
- Other databases: Listen to database changes from other databases, like MySQL.
- Finance: Listen to stock market events and broadcast them to connected users.
- Web3: Listen to blockchain events and broadcast them to connected users.
- A server clock which broadcasts a timer to every connected client (e.g. auction sites)

We're extremely excited about what the community develops.

## Demo

To show off the functionality that we're releasing, we've built a demo application.

[multiplayer.dev](https://multiplayer.dev)

Tech stack:

- [Realtime](https://github.com/supabase/realtime), powered by the [Phoenix Web Framework](https://www.phoenixframework.org/) and [Elixir](https://elixir-lang.org/).
- [Next.js](https://nextjs.org/) by [Vercel](https://vercel.com).
- Deployed on a [Fly.io](https://fly.io) - cluster of 20 nodes distributed around the world 🌍.

## Getting started

Sign up for the waitlist at [multiplayer.dev](https://multiplayer.dev).

You can follow development in our [open source repository on GitHub](https://github.com/supabase/realtime/tree/develop).
