---
id: about
title: About
description: 'What is Supabase?'
slug: /
---

## What it is

Supabase is an open source Firebase alternative. We are a service to:

- Listen to database changes.
- Query your tables, including filtering, pagination, and deeply nested relationships (like GraphQL).
- Create, update, and delete rows.
- Manage your users and their permissions.
- Interact with your database using a simple UI.

## What it isn't

Supabase is not a 1-to-1 mapping of Firebase. While we are building many of the features that Firebase offers, we are not going about it the same way.

Our technological choices are quite different to Firebase. Everything we use is open source. Wherever possible, we use and support existing tools in the ecosystem, rather than developing from scratch.

Most notably, we use Postgres rather than a NoSQL store. This was a deliberate choice. We believe that no other database on the market offers the scalability and functionality required to legitimately compete with Firebase.

## How it works

At its core, Supabase is a suite of open source tools, stitched together to build a seamless developer experience:

![Supabase Architecture](/img/supabase-architecture.png)

- [PostgreSQL](https://www.postgresql.org/) is an object-relational database system with over 30 years of active development that has earned it a strong reputation for reliability, feature robustness, and performance.
- [Realtime](https://github.com/supabase/realtime) is an Elixir server that allows you to listen to PostgreSQL inserts, updates, and deletes using WebSockets. Supabase listens to Postgres' built-in replication functionality, converts the replication byte stream into JSON, then broadcasts the JSON over WebSockets.
- [PostgREST](http://postgrest.org/) is a web server that turns your PostgreSQL database directly into a RESTful API.
- [postgres-meta](https://github.com/supabase/postgres-meta) is a RESTful API for managing your Postgres, allowing you to fetch tables, add roles, and run queries etc.
- [GoTrue](https://github.com/netlify/gotrue) is an SWT-based API for managing users and issuing SWT tokens.
- [Kong](https://github.com/Kong/kong) is a cloud-native API gateway.
