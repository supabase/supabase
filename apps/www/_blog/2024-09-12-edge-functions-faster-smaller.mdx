---
title: 'Edge Functions are now 2x smaller and boot 3x faster'
description: 'Redeploy your Edge Functions with the CLI v1.192.5 for a peformance boost'
author: nyannyacha
imgSocial: edge-functions-faster-smaller/edge-fns-faster-thumb.png
imgThumb: edge-functions-faster-smaller/edge-fns-faster-thumb.png
categories:
  - product
tags:
  - functions
date: '2024-09-12'
toc_depth: 3
---

We’ve rolled out some exciting updates to Edge Functions which bring significant reductions to function size and boot time. If you’re using [npm modules](https://supabase.com/blog/edge-functions-node-npm) in your functions, you should see function sizes being halved and boot time reduced by 300% in most cases.

To take advantage of these performance improvements, you can redeploy your functions using the Supabase CLI v1.192.5 or later.

Let’s compare the bundle size and boot time using some popular examples.

## Benchmarks

**Supabase JavaScript Client:**

|             | **CLI 1.190.0** | **CLI 1.192.5** | **Change** |
| ----------- | --------------- | --------------- | ---------- |
| Bundle size | 1.487MB         | 640.4KB         | -232.34%   |
| Boot time   | 275ms           | 25ms            | -1100%     |

```jsx
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data, error } = await supabase.from('countries').select('*')

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(String(err?.message ?? err), { status: 500 })
  }
})
```

**OpenAI:**

|             | **CLI 1.190.0** | **CLI 1.192.5** | **Change** |
| ----------- | --------------- | --------------- | ---------- |
| Bundle size | 2.533MB         | 1.045MB         | -242.39%   |
| Boot time   | 459ms           | 57ms            | -805.26%   |

```jsx
import OpenAI from 'npm:openai@4.57.3'

const client = new OpenAI({
  apiKey: Deno.env.get('OPEN_AI_KEY'),
})

Deno.serve(async (req) => {
  const { query } = await req.json()

  const chatCompletion = await client.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'gpt-3.5-turbo',
  })

  return new Response(chatCompletion)
})
```

**Drizzle / node-postgres:**

|             | **CLI 1.190.0** | **CLI 1.192.5** | Change   |
| ----------- | --------------- | --------------- | -------- |
| Bundle size | 929.5kB         | 491.3kB         | -189.19% |
| Boot time   | 301ms           | 83ms            | -362.65% |

```jsx
import { drizzle } from 'npm:drizzle-orm@0.33.0/node-postgres'
import pg from 'npm:pg@8.12.0'
const { Client } = pg

import { pgTable, serial, text, varchar } from 'npm:drizzle-orm@0.33.0/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  phone: varchar('phone', { length: 256 }),
})

const client = new Client({
  connectionString: Deno.env.get('SUPABASE_DB_URL'),
})

await client.connect()
const db = drizzle(client)

Deno.serve(async (req) => {
  const allUsers = await db.select().from(users)
  console.log(allUsers)

  return new Response('ok')
})
```

## How did we achieve these gains?

Let’s dive into the technical details.

### Lazy evaluating dependencies and reducing npm package section size

We use [eszip format](https://github.com/denoland/eszip) to bundle your function code and its dependencies when you deploy a function.

This binary format extracts the dependencies a function references from Deno's module graph and serializes them into a single file. It eliminates network requests at run time and avoids conflicts between dependencies.

This approach worked reasonably well until we added npm support. When functions started using npm modules, bundle sizes and boot times increased.

When a function is invoked, Edge Runtime loads the eszip binary for the function and passes it to a JavaScript worker (ie. isolate). The worker then loads the necessary modules from the eszip.

In the original implementation, before passing an eszip binary to the worker's module loader, we first checked the integrity of its contents. Each entry in it will have a checksum computed with the SHA-256 function immediately following the body bytes. By reading this and comparing it, we ensure that the eszip binary isn’t corrupted.

The problem is that calculating a checksum for every entry using SHA-256 is quite expensive, and we were pre-checking the integrity of all entries at a time when the worker doesn't even need that particular entry.

It is possible that some items that have been checked for integrity will not be referenced even if the worker reaches the end of its lifetime and reaches the end state.

Instead of performing the costly integrity check of all entries before passing it to the module loader, edge runtime lazily performs the integrity check whenever there is a request to load a specific entry from the eszip by the module loader.

This helped to significantly to reduce the boot times.

Another issue was that while serializing npm packages for embedding into eszip binaries, we used the JSON format. The entries in individual npm packages, which were already represented as bytes (`Vec<u8>`), were encoded as an array representation in JSON format (`[255, 216, 255, 224, 0, ...]`) instead of passing on as bytes, causing the outputs to bloat by up to 2x or more.

We refactored the serialization using the [`rkyv` crate](https://github.com/rkyv/rkyv) to encode this to lower to the byte level, which helped reducing the bundle sizes of eszip binaries containing npm packages.

You can find full details of the implementation in this PR https://github.com/supabase/edge-runtime/pull/343

### Using a more computationally efficient hashing function

There was a [recent change](https://github.com/denoland/eszip/pull/181) in the eszip crate, which allowed the configuration of the source checksum.

This allowed us to switch to xxHash-3 over SHA_256 for the source checksums. Given that the checksums are used to ensure the integrity of sources in eszip, we could rely on a non-cryptographic hash algorithm that’s more computationally efficient.

![comparison of hash functions](/images/blog/edge-functions-faster-smaller/hash-functions.png)

## How to redeploy your functions

To get the advantage of these optimizations, follow these steps:

- [Update Supabase CLI](https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli) to version is v1.195.2 or later.
- Then, redeploy your functions by running `supabase functions deploy [FUNCTION_NAME]`

## Getting Help

[Supabase Edge Runtime](https://github.com/supabase/edge-runtime) is fully open-source, and we value community contributions. If you would like to make any improvements, feel free to dive into the source and [create an issue](https://github.com/supabase/edge-runtime/issues).

If you have any issues with Edge Functions in your hosted project, please request support via [superbase.help](http://supabase.help).
