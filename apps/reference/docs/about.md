---
id: about
slug: /
sidebar_label: About
sidebar_position: 2
---

# Reference Documentation

This section of the docs provides technical descriptions of the products and how to use them.

There are two main sections:

- Supabase Reference Docs - describes to use the tools with integrated integrated libraries.
- Tools Reference Docs - describes to use the tools with modular libraries.

## Modularity

Supabase is modular. While it may seem like a single tool, it is actually a suite of tools that are composed on top of a PostgreSQL database. This offers several advantages:

- Each tool scales independently.
- Each tool can be self-hosted.
- Developers can disable tools which are not required.
- Each tool is focused on a single task to minimize complexity.

This is a similar approach to any Enterprise-grade system with an additional focus on modularity: while some companies might cut-corners, Supabase makes modularity a priority.

## Architecture

- `Database`
  - [PostgreSQL](https://www.postgresql.org/) is an object-relational database system with over 30 years of active development that has earned it a strong reputation for reliability, feature robustness, and performance.
  - Coonection Pooling: [PgBouncer](https://www.pgbouncer.org/) is a lightweight connection pooler for PostgreSQL.
  - [postgres-meta](https://github.com/supabase/postgres-meta) is a RESTful API for managing your Postgres, allowing you to fetch tables, add roles, and run queries, etc.
- `Auth`
  - Authentication: [GoTrue](https://github.com/supabase/gotrue) is an SWT based API for managing users and issuing SWT tokens.
  - Authorization: using [PostgreSQL Row Level Security](/docs/guides/auth/row-level-security).
- `APIs`
  - Websockets: [Realtime](https://github.com/supabase/realtime) is an Elixir server that allows you to listen to PostgreSQL inserts, updates, and deletes using websockets. Realtime polls Postgres' built-in replication functionality for database changes, converts changes to JSON, then broadcasts the JSON over websockets to authorized clients.
  - REST: [PostgREST](http://postgrest.org/) is a web server that turns your PostgreSQL database directly into a RESTful API
  - GraphQL: [pg_graphql](https://github.com/supabase/pg_graphql) adds GraphQL support to your PostgreSQL database.
  - Edge Functions: [Deno](https://deno.land/) is a modern and secure runtime for JavaScript, TypeScript, and WebAssembly.
  - Reverse Proxy: [Kong](https://github.com/Kong/kong) is a cloud-native API gateway.
- `File Storage`
  - [Storage](https://github.com/supabase/storage-api) provides a RESTful interface for managing Files stored in S3, using Postgres to manage permissions.

## Open source

Each part of the Supabase ecosystem is open source. Wherever possible, we support existing tools rather than developing from scratch.

We choose tools which are [OSI Compliant](https://opensource.org/licenses), with a strong bias towards MIT, Apache 2.0, and PostgreSQL licenses.
Everything we open source is licensed with one of these 3 licenses:

- MIT for client libraries
- Apache 2.0 for API servers
- PostgreSQL for any Postgres-related tooling

## Client Libraries

Supabase provides client libraries for building your products. Our approach for client libraries is modular. Each sub-library is a standalone implementation for a single system.

For example, our `supabase-js` library is a wrapper around five smaller libraries:

- `postgrest-js` (REST API)
- `gotrue-js` (Authentication)
- `storage-js` (File Storage)
- `realtime-js` (Websockets)
- `functions-js` (Edge Functions)

## Community

Supabase officially supports the Javascript libraries, and all other libraries are community-maintained. This is one way that we try to support and foster an open source ecosystem.

<table style={{ tableLayout: 'fixed', whiteSpace: 'nowrap' }}>
  <tr>
    <th colspan="2" style={{textAlign: 'right'}}>Supabase Tool:</th>
    <th>
      <a href="https://github.com/postgrest/postgrest" target="_blank" rel="noopener noreferrer">
        PostgREST
      </a>
    </th>
    <th>
      <a href="https://github.com/supabase/gotrue" target="_blank" rel="noopener noreferrer">
        GoTrue
      </a>
    </th>
    <th>
      <a href="https://github.com/supabase/realtime" target="_blank" rel="noopener noreferrer">
        Realtime
      </a>
    </th>
    <th>
      <a href="https://github.com/supabase/storage-api" target="_blank" rel="noopener noreferrer">
        Storage
      </a>
    </th>
    <th>
      <a
        href="https://github.com/supabase/functions"
        target="_blank"
        rel="noopener noreferrer"
      >
        Edge Functions
      </a>
    </th>
  </tr>
  <th colspan="7"></th>
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td>
      <a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">
        supabase-js
      </a>
    </td>
    <td>
      <a href="https://github.com/supabase/postgrest-js" target="_blank" rel="noopener noreferrer">
        postgrest-js
      </a>
    </td>
    <td>
      <a href="https://github.com/supabase/gotrue-js" target="_blank" rel="noopener noreferrer">
        gotrue-js
      </a>
    </td>
    <td>
      <a href="https://github.com/supabase/realtime-js" target="_blank" rel="noopener noreferrer">
        realtime-js
      </a>
    </td>
    <td>
      <a href="https://github.com/supabase/storage-js" target="_blank" rel="noopener noreferrer">
        storage-js
      </a>
    </td>
    <td>
      <a href="https://github.com/supabase/functions-js" target="_blank" rel="noopener noreferrer">
        functions-js
      </a>
    </td>
  </tr>
  <tr>
    <td>Dart</td>
    <td>
      <a
        href="https://github.com/supabase-community/supabase-dart"
        target="_blank"
        rel="noopener noreferrer"
      >
        supabase-dart
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/postgrest-dart"
        target="_blank"
        rel="noopener noreferrer"
      >
        postgrest-dart
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/gotrue-dart"
        target="_blank"
        rel="noopener noreferrer"
      >
        gotrue-dart
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/realtime-dart"
        target="_blank"
        rel="noopener noreferrer"
      >
        realtime-dart
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/storage-dart"
        target="_blank"
        rel="noopener noreferrer"
      >
        storage-dart
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/functions-dart"
        target="_blank"
        rel="noopener noreferrer"
      >
        functions-dart
      </a>
    </td>
  </tr>
  <tr>
    <td>Flutter</td>
    <td>
      <a
        href="https://github.com/supabase-community/supabase-flutter"
        target="_blank"
        rel="noopener noreferrer"
      >
        supabase-flutter
      </a>
    </td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <th colspan="7">Community</th>

  <tr>
    <td>C#</td>
    <td>
      <a
        href="https://github.com/supabase-community/supabase-csharp"
        target="_blank"
        rel="noopener noreferrer"
      >
        supabase-csharp
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/postgrest-csharp"
        target="_blank"
        rel="noopener noreferrer"
      >
        postgrest-csharp
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/gotrue-csharp"
        target="_blank"
        rel="noopener noreferrer"
      >
        gotrue-csharp
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/realtime-csharp"
        target="_blank"
        rel="noopener noreferrer"
      >
        realtime-csharp
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/storage-csharp"
        target="_blank"
        rel="noopener noreferrer"
      >
        storage-csharp
      </a>
    </td>
    <td>-</td>
  </tr>
  <tr>
    <td>Go</td>
    <td>-</td>
    <td>
      <a
        href="https://github.com/supabase-community/postgrest-go"
        target="_blank"
        rel="noopener noreferrer"
      >
        postgrest-go
      </a>
    </td>
    <td>-</td>
    <td>-</td>
    <td>
      <a
        href="https://github.com/supabase-community/storage-go"
        target="_blank"
        rel="noopener noreferrer"
      >
        storage-go
      </a>
    </td>
    <td>-</td>
  </tr>
  <tr>
    <td>Java</td>
    <td>-</td>
    <td>-</td>
    <td>
      <a
        href="https://github.com/supabase-community/gotrue-java"
        target="_blank"
        rel="noopener noreferrer"
      >
        gotrue-java
      </a>
    </td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Kotlin</td>
    <td>-</td>
    <td>
      <a
        href="https://github.com/supabase-community/postgrest-kt"
        target="_blank"
        rel="noopener noreferrer"
      >
        postgrest-kt
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/gotrue-kt"
        target="_blank"
        rel="noopener noreferrer"
      >
        gotrue-kt
      </a>
    </td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Python</td>
    <td>
      <a
        href="https://github.com/supabase-community/supabase-py"
        target="_blank"
        rel="noopener noreferrer"
      >
        supabase-py
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/postgrest-py"
        target="_blank"
        rel="noopener noreferrer"
      >
        postgrest-py
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/gotrue-py"
        target="_blank"
        rel="noopener noreferrer"
      >
        gotrue-py
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/realtime-py"
        target="_blank"
        rel="noopener noreferrer"
      >
        realtime-py
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/storage-py"
        target="_blank"
        rel="noopener noreferrer"
      >
        storage-py
      </a>
    </td>
    <td>-</td>
  </tr>
  <tr>
    <td>Ruby</td>
    <td>
      <a
        href="https://github.com/supabase-community/supabase-rb"
        target="_blank"
        rel="noopener noreferrer"
      >
        supabase-rb
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/postgrest-rb"
        target="_blank"
        rel="noopener noreferrer"
      >
        postgrest-rb
      </a>
    </td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Rust</td>
    <td>-</td>
    <td>
      <a
        href="https://github.com/supabase-community/postgrest-rs"
        target="_blank"
        rel="noopener noreferrer"
      >
        postgrest-rs
      </a>
    </td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Swift</td>
    <td>
      <a
        href="https://github.com/supabase-community/supabase-swift"
        target="_blank"
        rel="noopener noreferrer"
      >
        supabase-swift
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/postgrest-swift"
        target="_blank"
        rel="noopener noreferrer"
      >
        postgrest-swift
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/gotrue-swift"
        target="_blank"
        rel="noopener noreferrer"
      >
        gotrue-swift
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/realtime-swift"
        target="_blank"
        rel="noopener noreferrer"
      >
        realtime-swift
      </a>
    </td>
    <td>
      <a
        href="https://github.com/supabase-community/storage-swift"
        target="_blank"
        rel="noopener noreferrer"
      >
        storage-swift
      </a>
    </td>
    <td>-</td>
  </tr>
</table>
