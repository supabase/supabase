---
title: 'Architecture'
description: 'Supabase design and architecture'
tocVideo: 'T-qAtAKjqwc'
---

Supabase is open source. We choose open source tools which are scalable and make them simple to use.

Supabase is not a 1-to-1 mapping of Firebase. While we are building many of the features that Firebase offers, we are not going about it the same way:
our technological choices are quite different; everything we use is open source; and wherever possible, we use and support existing tools rather than developing from scratch.

Most notably, we use Postgres rather than a NoSQL store. This choice was deliberate. We believe that no other database offers the functionality required to compete with Firebase, while maintaining the scalability required to go beyond it.

## Choose your comfort level

Our goal at Supabase is to make _all_ of Postgres easy to use. That doesn’t mean you have to use all of it. If you’re a Postgres veteran, you’ll probably love the tools that we offer. If you’ve never used Postgres before, then start smaller and grow into it. If you just want to treat Postgres like a simple table-store, that’s perfectly fine.

## Architecture

Each Supabase project consists of several tools:

<Image
  alt="Diagram showing the architecture of Supabase. The Kong API gateway sits in front of 7 services: GoTrue, PostgREST, Realtime, Storage, pg_meta, Functions, and pg_graphql. All the services talk to a single Postgres instance."
  src={{
    dark: '/docs/img/supabase-architecture.svg',
    light: '/docs/img/supabase-architecture--light.svg',
  }}

width={1600}
height={767}
/>

### Postgres (database)

Postgres is the core of Supabase. We do not abstract the Postgres database—you can access it and use it with full privileges. We provide tools which make Postgres as easy to use as Firebase.

- Official Docs: [postgresql.org/docs](https://www.postgresql.org/docs/current/index.html)
- Source code: [github.com/postgres/postgres](https://github.com/postgres/postgres) (mirror)
  {/* supa-mdx-lint-disable-next-line Rule004ExcludeWords */}
- License: [PostgreSQL License](https://www.postgresql.org/about/licence/)- Language: C

### Studio (dashboard)

An open source Dashboard for managing your database and services.

- Official Docs: [Supabase docs](/docs)
- Source code: [github.com/supabase/supabase](https://github.com/supabase/supabase/tree/master/apps/studio)
- License: [Apache 2](https://github.com/supabase/supabase/blob/master/LICENSE)
- Language: TypeScript

### GoTrue (Auth)

A JWT-based API for managing users and issuing access tokens. This integrates with PostgreSQL's Row Level Security and the API servers.

- Official Docs: [Supabase Auth reference docs](/docs/reference/auth)
- Source code: [github.com/supabase/gotrue](https://github.com/supabase/gotrue)
- License: [MIT](https://github.com/supabase/gotrue/blob/master/LICENSE)
- Language: Go

### PostgREST (API)

A standalone web server that turns your Postgres database directly into a RESTful API.
We use this with our [`pg_graphql`](https://github.com/supabase/pg_graphql) extension to provide a GraphQL API.

- Official Docs: [postgrest.org](https://postgrest.org/)
- Source code: [github.com/PostgREST/postgrest](https://github.com/PostgREST/postgrest)
- License: [MIT](https://github.com/PostgREST/postgrest/blob/main/LICENSE)
- Language: Haskell

### Realtime (API & multiplayer)

A scalable WebSocket engine for managing user Presence, broadcasting messages, and streaming database changes.

- Official Docs: [Supabase Realtime docs](/docs/guides/realtime)
- Source code: [github.com/supabase/realtime](https://github.com/supabase/realtime)
- License: [Apache 2](https://github.com/supabase/realtime/blob/main/LICENSE)
- Language: Elixir

### Storage API (large file storage)

An S3-compatible object storage service that stores metadata in Postgres.

- Official Docs: [Supabase Storage reference docs](/docs/reference/storage)
- Source code: [github.com/supabase/storage-api](https://github.com/supabase/storage-api)
- License: [Apache 2.0](https://github.com/supabase/storage-api/blob/master/LICENSE)
- Language: Node.js / TypeScript

### Deno (Edge Functions)

A modern runtime for JavaScript and TypeScript.

- Official Docs: [Deno documentation](https://deno.land/)
- Source code: [Deno source code](https://github.com/denoland/deno)
- License: [MIT](https://github.com/denoland/deno/blob/main/LICENSE.md)
- Language: TypeScript / Rust

### `postgres-meta` (database management)

A RESTful API for managing your Postgres. Fetch tables, add roles, and run queries.

- Official Docs: [supabase.github.io/postgres-meta](https://supabase.github.io/postgres-meta/)
- Source code: [github.com/supabase/postgres-meta](https://github.com/supabase/postgres-meta)
- License: [Apache 2.0](https://github.com/supabase/postgres-meta/blob/master/LICENSE)
- Language: Node.js / TypeScript

### Supavisor

A cloud-native, multi-tenant Postgres connection pooler.

- Official Docs: [Supavisor GitHub Pages](https://supabase.github.io/supavisor/)
- Source code: [`supabase/supavisor`](https://github.com/supabase/supavisor)
- License: [Apache 2.0](https://github.com/supabase/supavisor/blob/main/LICENSE)
- Language: Elixir

### Kong (API gateway)

A cloud-native API gateway, built on top of NGINX.

- Official Docs: [docs.konghq.com](https://docs.konghq.com/)
- Source code: [github.com/kong/kong](https://github.com/kong/kong)
- License: [Apache 2.0](https://github.com/Kong/kong/blob/master/LICENSE)
- Language: Lua

## Product principles

It is our goal to provide an architecture that any large-scale company would design for themselves,
and then provide tooling around that architecture that is easy-to-use for indie-developers and small teams.

We use a series of principles to ensure that scalability and usability are never mutually exclusive:

### Everything works in isolation

Each system must work as a standalone tool with as few moving parts as possible.
The litmus test for this is: "Can a user run this product with nothing but a Postgres database?"

### Everything is integrated

Supabase is composable. Even though every product works in isolation, each product on the platform needs to 10x the other products.
For integration, each tool should expose an API and Webhooks.

### Everything is extensible

We're deliberate about adding a new tool, and prefer instead to extend an existing one.
This is the opposite of many cloud providers whose product offering expands into niche use-cases. We provide _primitives_ for developers, which allow them to achieve any goal.
Less, but better.

### Everything is portable

To avoid lock-in, we make it easy to migrate in and out. Our cloud offering is compatible with our self-hosted product.
We use existing standards to increase portability (like `pg_dump` and CSV files). If a new standard emerges which competes with a "Supabase" approach, we will deprecate the approach in favor of the standard.
This forces us to compete on user experience. We aim to be the best Postgres hosting service.

### Play the long game

We sacrifice short-term wins for long-term gains. For example, it is tempting to run a fork of Postgres with additional functionality which only our customers need.
Instead, we prefer to support efforts to upstream missing functionality so that the entire community benefits. This has the additional benefit of ensuring portability and longevity.

### Build for developers

"Developers" are a specific profile of user: they are _builders_.
When assessing impact as a function of effort, developers have a large efficiency due to the type of products and systems they can build.
As the profile of a developer changes over time, Supabase will continue to evolve the product to fit this evolving profile.

### Support existing tools

Supabase supports existing tools and communities wherever possible. Supabase is more like a "community of communities" - each tool typically has its own community which we work with.
Open source is something we approach [collaboratively](/blog/supabase-series-b#giving-back): we employ maintainers, sponsor projects, invest in businesses, and develop our own open source tools.
