---
title: 'Introducing iceberg-js: A JavaScript Client for Apache Iceberg'
description: 'A minimal, vendor-agnostic JavaScript client for the Apache Iceberg REST Catalog API, providing type-safe catalog management for JavaScript and TypeScript developers.'
author: katerina_skroumpelou
imgSocial: 2025-12-08-introducing-iceberg-js/og.png
imgThumb: 2025-12-08-introducing-iceberg-js/thumb.png
categories:
  - product
tags:
  - open-source
  - javascript
  - typescript
  - iceberg
date: '2025-12-08'
toc_depth: 2
---

Today we are releasing [`iceberg-js`](https://github.com/supabase/iceberg-js), a minimal, vendor-agnostic JavaScript client for the Apache Iceberg REST Catalog API.

[Apache Iceberg](https://iceberg.apache.org) is becoming the standard for large-scale analytics workloads. But until now, JavaScript and TypeScript developers have lacked a simple way to interact with Iceberg REST Catalogs.

## Why we built this

We recently launched [Analytics Buckets](https://supabase.com/blog/introducing-analytics-buckets) in the Supabase Dashboard. This feature lets you create and manage Iceberg tables directly from the Supabase UI. To power this experience, we needed a JavaScript library that could talk to Iceberg REST Catalogs.

We looked around and did not find what we needed. Most Iceberg tooling is built for JVM languages like Java and Scala. The JavaScript ecosystem had nothing lightweight and focused. So we built iceberg-js.

We care about supporting open-source tools and communities, and creating developer-friendly libraries is one of the ways we contribute.

## What it does

`iceberg-js` is a thin HTTP wrapper that mirrors the official Iceberg REST API. It provides a 1:1 mapping to the API, making it easy to manage namespaces and tables from any JavaScript or TypeScript environment.

The library is designed around a few core principles:

First, it is generic. It works with any Iceberg REST Catalog implementation. It is not tied to any specific vendor.

Second, it is minimal. There is no engine-specific logic and no heavy dependencies. It uses the native fetch API with support for custom implementations.

Third, it is type-safe. It provides full TypeScript support with strongly-typed request and response models.

## What it does not do

We were deliberate about what `iceberg-js` should not do. Keeping the scope narrow is what makes the library maintainable.

- `iceberg-js` does not support data operations. It cannot read or write Parquet files. For that, use a query engine like DuckDB, Spark, or Trino.

- It does not support query execution. It is purely a catalog management tool.

- It does not include engine-specific integrations. No Spark, Flink, or other engine code.

- It does not support advanced features like branching, tagging, or time travel queries beyond basic metadata operations.

These boundaries exist on purpose. For data operations, pair `iceberg-js` with a query engine that supports Iceberg.

## Quick start

Install the package:

```bash
npm install iceberg-js
```

Create a catalog client and start managing namespaces and tables:

```tsx
import { IcebergRestCatalog } from 'iceberg-js'

const catalog = new IcebergRestCatalog({
  baseUrl: 'https://my-catalog.example.com/iceberg/v1',
  auth: {
    type: 'bearer',
    token: process.env.ICEBERG_TOKEN,
  },
})

// Create a namespace
await catalog.createNamespace({ namespace: ['analytics'] })

// List tables
const tables = await catalog.listTables({ namespace: ['analytics'] })
```

The library supports multiple authentication methods including bearer tokens, custom headers, and custom functions for dynamic authentication.

## Compatibility

`iceberg-js` works everywhere JavaScript runs. It supports Node.js (ESM and CommonJS), TypeScript, modern browsers, Deno, and all major bundlers like Webpack, Vite, and Rollup.

All compatibility scenarios are tested in CI on Node.js 20 and 22.

## Open source

`iceberg-js` is MIT licensed and [available on GitHub](https://github.com/supabase/iceberg-js). We welcome contributions that align with the library's goals. Note, as mentioned above, the library is intentionally focused. We plan to keep it that way. If you need features outside the scope of catalog management, we recommend pairing `iceberg-js` with a query engine.

## Get started

You can start using `iceberg-js` today.

- GitHub: [github.com/supabase/iceberg-js](https://github.com/supabase/iceberg-js)

- API Documentation: [supabase.github.io/iceberg-js/](https://supabase.github.io/iceberg-js/)

- npm: [npmjs.com/package/iceberg-js](https://www.npmjs.com/package/iceberg-js)
