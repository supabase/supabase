---
# Specify the following for Cursor rules
description: Coding rules for Supabase Edge Functions
alwaysApply: false
---

# Writing Supabase Edge Functions

You're an expert in writing TypeScript and Deno JavaScript runtime. Generate **high-quality Supabase Edge Functions** that adhere to the following best practices:

## Guidelines

1. Try to use Web APIs and Deno's core APIs instead of external dependencies (eg: use fetch instead of Axios, use WebSockets API instead of node-ws)
2. If you are reusing utility methods between Edge Functions, add them to `supabase/functions/_shared` and import using a relative path. Do NOT have cross dependencies between Edge Functions.
3. Do NOT use bare specifiers when importing dependencies. If you need to use an external dependency, make sure it's prefixed with either `npm:` or `jsr:`. For example, `@supabase/supabase-js` should be written as `npm:@supabase/supabase-js`.
4. For external imports, always define a version. For example, `npm:express` should be written as `npm:express@4.18.2`.
5. For external dependencies, importing via `npm:` and `jsr:` is preferred. Minimize the use of imports from `deno.land/x`, `esm.sh` and `unpkg.com`. If you have a package from one of those CDNs, you can replace the CDN hostname with the `npm:` specifier.
6. You can also use Node built-in APIs. You will need to import them using the `node:` specifier. For example, to import Node process: `import process from "node:process"`. Use Node APIs when you find gaps in Deno APIs.
7. Do NOT use `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"`, and do NOT use `Deno.serve`. Instead, export a default object with a `fetch` handler:

   ```ts
   export default {
     fetch: async (req: Request) => {
       return Response.json({ message: 'Hello world' })
     },
   }
   ```

   This is the request handler contract for Supabase Edge Functions, and it also runs unchanged on Cloudflare Workers and Bun. Always wrap this handler with `withSupabase` to secure and configure it (see guideline 8).

8. Write your handler with `withSupabase` from `npm:@supabase/server@^1`. One wrapper gives you:
   - Authentication: verifies the caller's credentials.
   - Authorization: only lets through callers that match the `auth` mode you declare.
   - Pre-configured clients on `ctx`: `ctx.supabase` (scoped to the caller's RLS) and `ctx.supabaseAdmin` (bypasses RLS).
   - CORS handling, including preflight requests.

   Your one decision is the `auth` mode:

   ```ts
   import { withSupabase } from 'npm:@supabase/server@^1'

   export default {
     fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
       const { data, error } = await ctx.supabase.from('countries').select('*')
       if (error) throw error
       return Response.json({ data })
     }),
   }
   ```

   Choose the `auth` mode by who calls the function:

   | Caller                                               | `auth`          | `verify_jwt`           | Client                             |
   | ---------------------------------------------------- | --------------- | ---------------------- | ---------------------------------- |
   | Signed-in user (JWT on `Authorization`)              | `'user'`        | `true` (default, omit) | `ctx.supabase` (RLS-scoped)        |
   | Cron, worker, `pg_net`, or another function          | `'secret'`      | `false`                | `ctx.supabaseAdmin` (bypasses RLS) |
   | Public client                                        | `'publishable'` | `false`                | `ctx.supabase`                     |
   | Public endpoint or external webhook (verify in code) | `'none'`        | `false`                | `ctx.supabaseAdmin` if needed      |

   For any mode other than `'user'`, set `verify_jwt = false` for that function in `supabase/config.toml`:

   ```toml
   [functions.my-function]
   verify_jwt = false
   ```

   `ctx.userClaims` holds the verified user identity. To accept only one named key, use `auth: 'secret:<name>'` or `auth: 'publishable:<name>'`. For a public endpoint, use `auth: 'none'`; you still get CORS handling and `ctx.supabaseAdmin`.

9. The following environment variables (ie. secrets) are pre-populated in both local and hosted Supabase environments. Users don't need to manually set them:
   - SUPABASE_URL
   - SUPABASE_PUBLISHABLE_KEYS
   - SUPABASE_SECRET_KEYS
   - SUPABASE_DB_URL

   `withSupabase` reads these for you, so prefer it over reading keys by hand. If you must read a key without the SDK, parse the JSON map and index it by name: `const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)`, then `SUPABASE_SECRET_KEYS['default']` for the default secret key. The publishable keys work the same way through `SUPABASE_PUBLISHABLE_KEYS`.

10. To set other environment variables (ie. secrets) users can put them in an env file and run `supabase secrets set --env-file path/to/env-file`.
11. A single Edge Function can handle multiple routes. It is recommended to use a library like Hono or Express to handle the routes as it's easier for developers to understand and maintain. Each route must be prefixed with `/function-name` so they are routed correctly. For per-route Supabase auth with Hono, use the adapter from `npm:@supabase/server@^1/adapters/hono`.
12. File write operations are ONLY permitted on the `/tmp` directory. You can use either Deno or Node File APIs.
13. Use the `EdgeRuntime.waitUntil(promise)` static method to run long-running tasks in the background without blocking the response to a request. Do NOT assume it is available in the request / execution context.

## Example Templates

### Recommended: Edge Function with `withSupabase`

```ts
import { withSupabase } from 'npm:@supabase/server@^1'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const { data, error } = await ctx.supabase.from('countries').select('*')
    if (error) throw error
    return Response.json({ data })
  }),
}
```

### Simple Hello World Function

```ts
interface reqPayload {
  name: string
}

console.info('server started')

export default {
  fetch: async (req: Request) => {
    const { name }: reqPayload = await req.json()
    const data = {
      message: `Hello ${name} from foo!`,
    }

    return Response.json(data)
  },
}
```

### Example Function using Node built-in API

```ts
import { randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import process from 'node:process'

const generateRandomString = (length) => {
  const buffer = randomBytes(length)
  return buffer.toString('hex')
}

const randomString = generateRandomString(10)
console.log(randomString)

const server = createServer((req, res) => {
  const message = `Hello`
  res.end(message)
})

server.listen(9999)
```

### Using npm packages in Functions

```ts
import express from 'npm:express@^5'

const app = express()

app.get(/(.*)/, (req, res) => {
  res.send('Welcome to Supabase')
})

app.listen(8000)
```

### Generate embeddings using built-in @Supabase.ai API

```ts
const model = new Supabase.ai.Session('gte-small')

export default {
  fetch: async (req: Request) => {
    const params = new URL(req.url).searchParams
    const input = params.get('text')
    const output = await model.run(input, { mean_pool: true, normalize: true })
    return Response.json(output)
  },
}
```
