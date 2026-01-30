---
title: 'Postgres Foreign Data Wrappers with Wasm'
description: 'Build Wasm foreign data wrapper with Wrappers and use it on Supabase'
author: bo_lu
imgSocial: lw12/day-5/OG_FDW-with-WASM.png
imgThumb: lw12/day-5/thumb_FDW-with-WASM.png
launchweek: '12'
categories:
  - launch-week
  - developers
  - product
tags:
  - launch-week
  - wasm
  - wrappers
date: '2024-08-16'
toc_depth: 3
---

Foreign Data Wrappers (FDWs) allow Postgres to interact with externally hosted data. To operate a FDW, the user creates a foreign table. When queried, the foreign table reaches out to the 3rd party service, collects the requested data, and returns it to the query in the shape defined by the foreign table. This allows seamless querying and data manipulation across different tools as if they were local tables from within Postgres.

[Wrappers](https://github.com/supabase/wrappers) is a Rust framework for creating Postgres Foreign Data Wrappers. Today we're releasing support for [Wasm (WebAssembly)](https://webassembly.org/) wrappers.

With this feature, anyone can create a Wasm wrapper to an external service and run it directly from e.g. GitHub:

```sql
-- An Example Google Sheets Wasm Wrapper:

create server google_sheets
  foreign data wrapper wasm_wrapper
  options (
    -- Install from GitHub
    fdw_package_url 'https://github.com/<ORG>/<REPO>/releases/download/v0.2.0/google_sheets_fdw.wasm',
    fdw_package_name 'my-company:google-sheets-fdw',
    fdw_package_version '0.2.0',
    fdw_package_checksum '338674c4c983aa6dbc2b6e63659076fe86d847ca0da6d57a61372b44e0fe4ac9',

	-- Provide custom options
	base_url 'https://docs.google.com/spreadsheets/d'
  );
```

This feature is available today in public alpha for all new projects.

<div className="video-container">
  <iframe
    className="w-full"
    src="https://www.youtube-nocookie.com/embed/wCwEWR4k0no"
    title="Build Wasm foreign data wrapper with Wrappers and use it on Supabase"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  />
</div>

## What are Foreign Data Wrappers?

[Foreign Data Wrappers (FDW)](https://wiki.postgresql.org/wiki/Foreign_data_wrappers) are a powerful feature of Postgres that allows you to connect to and query external data sources as if they were regular tables.

<div>
  <Img
    alt="Foreign Data Wrappers"
    src={{
      light: '/images/blog/lw12/day-5/FDW--light.png',
      dark: '/images/blog/lw12/day-5/FDW.png',
    }}
  />
</div>

[Wrappers](https://github.com/supabase/wrappers) is an open source project that simplifies the creation of Postgres Foreign Data Wrappers using [Rust](https://www.rust-lang.org/).

## Why WebAssembly?

[WebAssembly (Wasm)](https://webassembly.org/) is a binary instruction format that enables secure and high-performance execution of code on the web. It is originally designed for web browsers, but now can also be used in server-side environments like Postgres.

Here's how the Wasm FDW benefits us:

- **Improved Security:** Wasm's sandboxed execution runtime with minimum interfaces enhances the security of FDW.
- **Simplified Development:** Developers can use [Rust](https://www.rust-lang.org/) to create complex FDWs without diving deep into Postgres internal API.
- **Simplified Distribution:** Easily distribute your Wasm FDW through any URL-accessible storage (such as GitHub or S3).
- **Enhanced Performance:** Wasm's near-native speed ensures FDWs operate with minimal overhead.
- **Increased Modularity:** Each Wasm FDW is an isolated package which is dynamically loaded and executed by Wrappers individually.

## Architecture

To better understand how the Wasm FDW works, let's take a look at the architecture:

<div>
  <Img
    alt="Wasm FDW architecture"
    src={{
      light: '/images/blog/lw12/day-5/FDW-architecture--light.png',
      dark: '/images/blog/lw12/day-5/FDW-architecture.png',
    }}
  />
</div>

The above diagram illustrates the key components and how they interact:

1. **Supabase Wrappers Extension (Host):** This is the core component that runs within Postgres. It includes below modules:
   - **Wasm Runtime:** Provides runtime environment to executes the Wasm FDW package.
   - **HTTP Interface:** Manages communication with external data sources through HTTP.
   - **Utilities:** Helper tools and functions to support FDW operations.
   - Other modules providing specific functionalities, such like JWT, stats and etc.
2. **Wasm FDWs (Guests):** Isolated, dynamically-loaded Wasm packages that perform data fetching and processing. They execute in a sandboxed environment to ensure security and performance. For example:
   - **Snowflake Wasm FDW:** A foreign data wrapper specifically designed to interact with [Snowflake](https://www.snowflake.com/).
   - **Paddle Wasm FDW:** Another FDW example, tailored for [Paddle](https://www.paddle.com/) integration.
3. **Web Storage:** Represents external storage services like [GitHub](https://github.com/) or [S3](https://aws.amazon.com/s3/), where Wasm packages can be publicly stored and downloaded from.
4. **External Data Source:** Various external systems which data is fetched from or pushed to, such as [Snowflake](https://www.snowflake.com/) and [Paddle](https://www.paddle.com/). Data is accessed using RESTful APIs.

## Data fetching

Wasm FDWs are loaded dynamically when the first request is made. The interaction flow is:

1. **Wasm download:** The Wasm FDWs are dynamically downloaded from web storage services, like GitHub or S3, and cached locally. This happens the first time the `SELECT` statement is initiated.
2. **Initialization and Execution:** Once downloaded, the Wasm FDWs are initialized and executed within the embedded Wasm runtime environment. This provides a secure, sandboxed execution environment that isolates the packages from the main Postgres system.
3. **Data Fetching via RESTful API:** The Wasm FDWs interact with their respective external data sources via RESTful APIs.
4. **Query Handling and Data Integration:** When a query is executed against a foreign table in Postgres, the Supabase Wrappers extension invokes the appropriate Wasm FDW, fetches data from the external source, processes it, and returns it to the Supabase Wrappers, which integrates it back into the Postgres query execution pipeline.

The Wasm FDW currently only supports data sources which have HTTP(s) based JSON API, other sources such like TCP/IP based DBMS or local files are not supported yet.

## Developing your own Wasm FDW

A major benefit of Wasm FDW is that you can build your own FDW and use it on Supabase. To get started, clone the [Postgres Wasm FDW [Template]](https://github.com/supabase-community/postgres-wasm-fdw). Building your own Wasm FDWs opens up a world of possibilities for integrating diverse data sources into Postgres.

Visit [Wrappers docs and guides](https://fdw.dev/guides/create-wasm-wrapper/) to learn more about how to develop a Wasm FDW.

<Admonition>

As the Wasm FDW can access external data sources, you should never install Wasm Wrappers from untrusted source. Always use official Supabase FDWs, or use sources which you have full visibility and control.

</Admonition>

## Try it now on Supabase

The Wasm FDW feature is available today on the Supabase platform. We have 2 new built-in Wasm FDWs: [Snowflake](https://supabase.com/docs/guides/database/extensions/wrappers/snowflake) and [Paddle](https://supabase.com/docs/guides/database/extensions/wrappers/paddle).

To get started, follow below steps:

1. Create a new Supabase project: [database.new](http://database.new)
2. Navigate to the [Database -> Wrappers](https://supabase.com/dashboard/project/_/database/wrappers) section and enable Wrappers.
3. Add `Snowflake` or `Paddle` wrapper, follow the instructions and create foreign tables.

<div>
  <Img
    alt="Supabase Dashboard Wrappers"
    src={{
      light: '/images/blog/lw12/day-5/dashboard-wrappers.png',
      dark: '/images/blog/lw12/day-5/dashboard-wrappers.png',
    }}
  />
</div>

We can also use SQL. Let's try, using the Paddle FDW as an example.

### Enable Wasm Wrappers

Inside the [SQL editor](https://supabase.com/dashboard/project/_/sql/new), enable the Wasm Wrapper feature:

```sql
-- install Wrappers extension
create extension if not exists wrappers with schema extensions;

-- create Wasm foreign data wrapper
create foreign data wrapper wasm_wrapper
  handler wasm_fdw_handler
  validator wasm_fdw_validator;
```

### Get your Paddle credentials

Sign up for [a sandbox account](https://developer.paddle.com/api-reference/overview#base-url) and [get API key](https://sandbox-vendors.paddle.com/authentication-v2) with Paddle.

### Save your Paddle credentials

Create a Paddle server in Postgres using the Wasm FDW created above:

```sql
-- create Paddle foreign server
create server paddle_server
  foreign data wrapper wasm_wrapper
  options (
    -- check all available versions at
    -- https://fdw.dev/catalog/paddle/#available-versions
    fdw_package_url 'https://github.com/supabase/wrappers/releases/download/wasm_paddle_fdw_v0.1.1/paddle_fdw.wasm',
    fdw_package_name 'supabase:paddle-fdw',
    fdw_package_version '0.1.1',
    fdw_package_checksum 'c5ac70bb2eef33693787b7d4efce9a83cde8d4fa40889d2037403a51263ba657',

    -- save your Paddle credentials
    api_url 'https://sandbox-api.paddle.com',
    api_key '<your Paddle sandbox API key>'
  );
```

### Set up your Foreign Tables

Create a table for Paddle data:

```sql
-- create dedicated schema for Paddle foreign tables
create schema if not exists paddle;

-- create foreign table
create foreign table paddle.customers (
  id text,
  name text,
  email text,
  status text,
  custom_data jsonb,
  created_at timestamp,
  updated_at timestamp,
  attrs jsonb
)
server paddle_server
options (
  object 'customers',
  rowid_column 'id'
);
```

### Query Paddle from Postgres

Now let's query the foreign table and check the result:

```sql
select id, name, email, status
from paddle.customers;
```

<div>
  <Img
    alt="Paddle FDW Output"
    src={{
      light: '/images/blog/lw12/day-5/paddle-fdw-output.png',
      dark: '/images/blog/lw12/day-5/paddle-fdw-output.png',
    }}
  />
</div>

That's it. Head over to the [Supabase Wrappers documentation](https://fdw.dev/) to find more detailed guides on setting up and using Wasm FDWs.

## Thanks to our community contributors

None of this innovation would have been possible without the relentless efforts and contributions of our vibrant community. We'd like to thank all the following developers for their contributions:

[Aayushya Vajpayee](https://github.com/AayushyaVajpayee), [Romain Graux](https://github.com/romaingrx)

Want to join the Supabase Wrappers community contributors? [Check out our contribution docs](https://fdw.dev/contributing/core/).
