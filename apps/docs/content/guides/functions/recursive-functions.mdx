---
id: 'function-recursive-functions'
title: 'Recursive / Nested Function Calls'
description: 'Learn about rate limiting for Edge Functions that call other Edge Functions'
subtitle: 'Understanding rate limits when Edge Functions invoke each other'
---

Edge Functions can call other Edge Functions using `fetch()`. This enables powerful patterns like function chaining, fan-out/fan-in workflows, and recursive processing. To protect platform stability and prevent runaway amplification, Supabase rate limits these internal function-to-function calls.

## What gets rate limited

Rate limiting applies to **outbound `fetch()` calls** made by your Edge Functions to other Edge Functions within your project. This includes:

- **Direct recursion**: A function calling itself
- **Function chaining**: Function A calling Function B
- **Circular calls**: Function A calling Function B, which calls Function A
- **Fan-out patterns**: A function calling multiple other functions concurrently

<Admonition type="note">

Inbound requests to your Edge Functions and requests to external APIs (e.g., Stripe, OpenAI) are **not** subject to this rate limit. Only outbound calls from one Edge Function to another Edge Function are counted.

</Admonition>

## Rate limit budget

Each request chain has a budget of at least **5,000 requests per minute**. In busier regions, this budget may be higher. All function-to-function calls within the same request chain share this budget.

For example, if Function A calls Function B, and Function B calls Function C, all three calls count toward the same budget pool.

## Handling rate limit errors

When the rate limit is exceeded, calling another Edge Function throws a `RateLimitError`. This error includes a `retryAfterMs` property indicating how long to wait (in milliseconds) before retrying. You should catch this error and handle it gracefully:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="supabase-js"
  queryGroup="client"
>
<TabPanel id="supabase-js" label="supabase-js">

```typescript
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_PUBLISHABLE_KEYS = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')!)

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  // If you want to use a different api key, change 'default' to your preferred key name
  SUPABASE_PUBLISHABLE_KEYS['default']
)

Deno.serve(async (req) => {
  try {
    const { data, error } = await supabase.functions.invoke('other-function', {
      body: { foo: 'bar' },
    })

    if (error) throw error

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    if (err instanceof Deno.errors.RateLimitError) {
      // Use retryAfterMs to tell the client when to retry
      const retryAfterSeconds = Math.ceil(err.retryAfterMs / 1000)
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable. Please retry later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfterSeconds.toString(),
          },
        }
      )
    }
    throw err
  }
})
```

</TabPanel>

<TabPanel id="fetch" label="fetch">

```typescript
const SUPABASE_PUBLISHABLE_KEYS = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')!)
// If you want to use a different api key, change 'default' to your preferred key name
const SUPABASE_DEFAULT_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEYS['default']

Deno.serve(async (req) => {
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/other-function`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_DEFAULT_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ foo: 'bar' }),
    })
    return response
  } catch (err) {
    if (err instanceof Deno.errors.RateLimitError) {
      // Use retryAfterMs to tell the client when to retry
      const retryAfterSeconds = Math.ceil(err.retryAfterMs / 1000)
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable. Please retry later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfterSeconds.toString(),
          },
        }
      )
    }
    throw err
  }
})
```

</TabPanel>
</Tabs>

You can also use `retryAfterMs` to implement automatic retries within your function:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="supabase-js"
  queryGroup="client"
>
<TabPanel id="supabase-js" label="supabase-js">

```typescript
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_PUBLISHABLE_KEYS = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')!)

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  // If you want to use a different api key, change 'default' to your preferred key name
  SUPABASE_PUBLISHABLE_KEYS['default']
)

async function invokeWithRetry(functionName: string, payload: object, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
      })
      if (error) throw error
      return data
    } catch (err) {
      if (err instanceof Deno.errors.RateLimitError && attempt < maxRetries - 1) {
        // Wait for the recommended duration before retrying
        await new Promise((resolve) => setTimeout(resolve, err.retryAfterMs))
        continue
      }
      throw err
    }
  }
}
```

</TabPanel>

<TabPanel id="fetch" label="fetch">

```typescript
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetch(url, options)
    } catch (err) {
      if (err instanceof Deno.errors.RateLimitError && attempt < maxRetries - 1) {
        // Wait for the recommended duration before retrying
        await new Promise((resolve) => setTimeout(resolve, err.retryAfterMs))
        continue
      }
      throw err
    }
  }
}
```

</TabPanel>
</Tabs>

## Tips for avoiding rate limits

### 1. Batch operations instead of individual calls

Instead of calling a function once per item, batch multiple items into a single call:

```typescript
// ❌ Avoid: One call per item
for (const item of items) {
  await supabase.functions.invoke('process-item', { body: item })
}

// ✅ Better: Batch items into one call
await supabase.functions.invoke('process-items', { body: { items } })
```

### 2. Limit recursion depth

If your function is recursive, set a maximum depth to prevent unbounded call chains:

```typescript
Deno.serve(async (req) => {
  const { depth = 0, data } = await req.json()

  if (depth >= 5) {
    // Stop recursion at max depth
    return new Response(JSON.stringify({ result: data }))
  }

  // Process and recurse with incremented depth
  const processed = processData(data)
  const { data: result } = await supabase.functions.invoke('my-function', {
    body: { depth: depth + 1, data: processed },
  })

  return new Response(JSON.stringify(result))
})
```

### 3. Use queues for large workloads

For processing large datasets, consider using [Supabase Queues](/docs/guides/queues) instead of recursive function calls. Queues handle backpressure automatically and are better suited for high-volume workloads.

### 4. Use shared libraries instead of separate functions

Instead of creating separate Edge Functions that call each other, create a shared library of functions and import them directly. This avoids HTTP overhead and rate limits entirely:

```typescript
// supabase/functions/_shared/transform.ts
export function validate(data: any) {
  // validation logic
}

export function transform(data: any) {
  // transformation logic
}

export async function save(data: any) {
  // save logic
}
```

```typescript
// supabase/functions/process-data/index.ts
import { validate, transform, save } from '../_shared/transform.ts'

Deno.serve(async (req) => {
  const data = await req.json()
  const validated = validate(data)
  const transformed = transform(validated)
  const result = await save(transformed)
  return new Response(JSON.stringify(result))
})
```

### 5. Add delays for non-urgent processing

If immediate processing isn't required, add delays between calls to spread the load:

```typescript
async function processWithDelay(items: any[]) {
  for (const item of items) {
    await supabase.functions.invoke('process-item', { body: item })
    await new Promise((resolve) => setTimeout(resolve, 100)) // 100ms delay
  }
}
```

## Common patterns and their impact

| Pattern                         | Budget consumption | Recommendation    |
| ------------------------------- | ------------------ | ----------------- |
| Simple chain (A to B to C)      | Low                | Generally safe    |
| Fan-out (A to B, C, D, E)       | Moderate           | Limit concurrency |
| Deep recursion (A to A to A...) | High               | Set max depth     |
| Unbounded loops                 | Very high          | Avoid, use queues |

## Increasing rate limits

Currently, all plans have the same rate limit budget. We are working on introducing custom limits for different use cases.

If you need a higher rate limit for your project, [contact support](/dashboard/support/new) with details about your use case.
