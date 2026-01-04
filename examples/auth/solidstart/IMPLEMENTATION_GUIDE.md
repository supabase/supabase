# SolidStart SSR Authentication - Implementation Guide

This guide explains how to implement server-side authentication with Supabase in SolidStart, highlighting key differences from other frameworks like Next.js.

## Table of Contents

1. [Key Differences from Next.js](#key-differences-from-nextjs)
2. [Architecture Overview](#architecture-overview)
3. [Session Management](#session-management)
4. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
5. [Best Practices](#best-practices)
6. [Advanced Patterns](#advanced-patterns)

## Key Differences from Next.js

### 1. No NextRequest/NextResponse

SolidStart uses **Vinxi** as its server runtime, which provides different HTTP utilities:

**Next.js:**
```ts
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  // ...
}
```

**SolidStart:**
```ts
import { getCookie, setCookie, getHeader } from 'vinxi/http'
import { createMiddleware } from '@solidjs/start/middleware'

export default createMiddleware({
  onRequest: [async (event) => {
    // Use Vinxi utilities
  }]
})
```

### 2. Middleware vs "use server"

In **Next.js**, you can use Server Actions (`"use server"`) alongside middleware without issues.

In **SolidStart**, these serve different purposes:

- **Middleware** (`src/middleware.ts`): Runs before route handlers, handles session refresh
- **`"use server"`**: Marks functions as server-only RPC endpoints for data fetching and mutations

**❌ Don't do this:**
```ts
// middleware.ts
export default createMiddleware({
  onRequest: [async (event) => {
    'use server' // ❌ This causes bundling issues
  }]
})
```

**✅ Do this instead:**
```ts
// middleware.ts
export default createMiddleware({
  onRequest: [async (event) => {
    // No "use server" here
    await updateSession()
  }]
})

// routes/protected.tsx
const getUser = cache(async () => {
  'use server' // ✅ Use it in route loaders/actions
  const supabase = getSupabaseServerClient()
  return await supabase.auth.getUser()
}, 'user')
```

### 3. Cookie Handling

**Next.js** provides `cookies()` from `next/headers`:
```ts
import { cookies } from 'next/headers'

const cookieStore = await cookies()
cookieStore.get('name')
```

**SolidStart** uses Vinxi's HTTP utilities:
```ts
import { getCookie, setCookie, getHeader } from 'vinxi/http'

// Parse Cookie header manually
const cookieHeader = getHeader('Cookie') ?? ''
const cookies = cookieHeader.split(';').map(/* ... */)
```

### 4. Environment Variables

**Next.js:**
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**SolidStart** (uses Vite):
```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Access via `import.meta.env.VITE_*` instead of `process.env.NEXT_PUBLIC_*`.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Request Lifecycle                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Request arrives                                     │
│      ↓                                                  │
│  2. Middleware runs (src/middleware.ts)                 │
│      ↓                                                  │
│  3. Session refresh via updateSession()                 │
│      ↓                                                  │
│  4. Route loader executes (with "use server")           │
│      ↓                                                  │
│  5. Server client reads refreshed session               │
│      ↓                                                  │
│  6. Component renders                                   │
│      ↓                                                  │
│  7. Response sent (with updated cookies)                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Session Management

### How Sessions Work

1. **Initial Authentication**: User signs in via `signInWithPassword()` or OAuth
2. **Cookie Storage**: Supabase stores the session in a cookie named `sb-<project_ref>-auth-token`
3. **Automatic Refresh**: Middleware calls `getUser()` on every request, which refreshes the token if needed
4. **Cookie Updates**: Refreshed tokens are written back to cookies via `setCookie()`

### Session Refresh Flow

```ts
// src/lib/supabase/middleware.ts
export async function updateSession() {
  const supabase = createServerClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { /* Read cookies from request */ },
        setAll(cookiesToSet) { /* Write cookies to response */ }
      }
    }
  )

  // This call triggers token refresh if needed
  await supabase.auth.getUser()

  return supabase
}
```

**Key points:**
- `getUser()` validates the JWT and refreshes it if expired
- `setAll()` is called automatically by `@supabase/ssr` when the token is refreshed
- The refreshed token is available in subsequent server-side code

## Common Mistakes to Avoid

### ❌ Mistake 1: Using `getSession()` for Auth Checks

```ts
// ❌ INSECURE - Session can be spoofed
const { data: { session } } = await supabase.auth.getSession()
if (session) {
  // User might not be authenticated!
}
```

**Why it's wrong:** `getSession()` only reads from the cookie without validating the JWT signature. A malicious user could craft a fake session cookie.

**✅ Correct approach:**
```ts
// ✅ SECURE - Validates JWT signature
const { data: { user } } = await supabase.auth.getUser()
if (user) {
  // User is definitely authenticated
}
```

### ❌ Mistake 2: Creating Client in Global Scope

```ts
// ❌ BAD - Shared across requests
import { getSupabaseServerClient } from '~/lib/supabase/server'

const supabase = getSupabaseServerClient() // Global instance!

export default function MyRoute() {
  // This uses a stale/shared client
}
```

**Why it's wrong:** The client would be shared across all users, leading to session leakage.

**✅ Correct approach:**
```ts
// ✅ GOOD - Fresh client per request
import { query } from '@solidjs/router'

const getUser = query(async () => {
  'use server'
  const supabase = getSupabaseServerClient() // Created per request
  return await supabase.auth.getUser()
}, 'user')
```

### ❌ Mistake 3: Using "use server" in Middleware

```ts
// ❌ BAD - Causes bundling issues
export default createMiddleware({
  onRequest: [
    async (event) => {
      'use server' // Don't do this!
      await updateSession()
    }
  ]
})
```

**Why it's wrong:** Middleware already runs on the server. Adding `"use server"` can cause the bundler to treat it as an RPC endpoint, leading to module resolution issues.

**✅ Correct approach:**
```ts
// ✅ GOOD - No "use server" in middleware
export default createMiddleware({
  onRequest: [
    async (event) => {
      await updateSession() // Just call the function
    }
  ]
})
```

### ❌ Mistake 4: Not Handling Cookie Parsing Correctly

```ts
// ❌ BAD - Incomplete cookie parsing
getAll() {
  const cookieHeader = getHeader('Cookie')
  return cookieHeader?.split(';') // Returns strings, not objects!
}
```

**✅ Correct approach:**
```ts
// ✅ GOOD - Proper cookie parsing
getAll() {
  const cookieHeader = getHeader('Cookie') ?? ''
  return cookieHeader
    .split(';')
    .map((cookie) => {
      const [name, ...rest] = cookie.trim().split('=')
      return { name, value: rest.join('=') }
    })
    .filter((cookie) => cookie.name)
}
```

### ❌ Mistake 5: Forgetting to Call Middleware

```ts
// app.config.ts - No middleware configured!
export default defineConfig({
  server: {
    preset: 'node-server',
  },
})
```

**Why it's wrong:** Without middleware, sessions won't be refreshed, leading to "Invalid JWT" errors.

**✅ Correct approach:**

1. Create `src/middleware.ts`
2. Middleware is automatically picked up by SolidStart

## Best Practices

### 1. Use Cache Functions for Server Data

Cache functions prevent duplicate server calls and improve performance:

```ts
import { cache } from '@solidjs/router'

const getUser = cache(async () => {
  'use server'
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}, 'user') // Cache key

export const route = {
  load: () => getUser() // Called once per request
}

export default function MyRoute() {
  const user = createAsync(() => getUser()) // Uses cached result
  // ...
}
```

### 2. Protect Routes at the Loader Level

Don't rely on client-side checks for protection:

```ts
// ✅ GOOD - Server-side protection
const getUser = cache(async () => {
  'use server'
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw redirect('/login') // Redirect on server
  }

  return user
}, 'protected-user')

export const route = {
  load: () => getUser() // Runs on server before render
}
```

### 3. Use Actions for Mutations

Server actions handle form submissions and data mutations:

```ts
import { action, redirect } from '@solidjs/router'

const loginAction = action(async (formData: FormData) => {
  'use server'
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = getSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  throw redirect('/')
})
```

### 4. Separate Client and Server Code

Keep browser and server clients separate:

```
src/lib/supabase/
├── client.ts      // For browser (realtime, client-side queries)
├── server.ts      // For server (loaders, actions)
└── middleware.ts  // For middleware (session refresh)
```

**Browser client** (`client.ts`):
- Used in components for realtime subscriptions
- Can query public data
- No access to user session on initial render

**Server client** (`server.ts`):
- Used in loaders/actions with `"use server"`
- Has access to user session
- Used for authenticated queries

### 5. Handle Errors Gracefully

```ts
const getUser = cache(async () => {
  'use server'
  const supabase = getSupabaseServerClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Auth error:', error.message)
      throw redirect('/login')
    }

    return user
  } catch (err) {
    console.error('Unexpected error:', err)
    throw redirect('/error')
  }
}, 'user')
```

## Advanced Patterns

### Pattern 1: Conditional Middleware

Only run session refresh on authenticated routes:

```ts
// src/middleware.ts
import { createMiddleware } from '@solidjs/start/middleware'
import { updateSession } from '~/lib/supabase/middleware'
import { getRequestEvent } from 'solid-js/web'

export default createMiddleware({
  onRequest: [
    async (event) => {
      const url = new URL(event.request.url)

      // Skip middleware for public routes
      if (url.pathname.startsWith('/public')) {
        return
      }

      await updateSession()
    }
  ]
})
```

### Pattern 2: RLS (Row Level Security) Policies

Always use RLS policies in Supabase for defense in depth:

```sql
-- Example: Users can only read their own data
create policy "Users can read own data"
  on profiles for select
  using (auth.uid() = id);

-- Example: Users can update their own data
create policy "Users can update own data"
  on profiles for update
  using (auth.uid() = id);
```

Even if your server-side code has a bug, RLS ensures users can't access each other's data.

### Pattern 3: Type-Safe User Context

Create a typed context for the current user:

```ts
// src/lib/auth/context.tsx
import { createContext, useContext } from 'solid-js'
import type { User } from '@supabase/supabase-js'

const UserContext = createContext<User | null>()

export function UserProvider(props: { user: User | null; children: any }) {
  return (
    <UserContext.Provider value={props.user}>
      {props.children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const user = useContext(UserContext)
  if (user === undefined) {
    throw new Error('useUser must be used within UserProvider')
  }
  return user
}
```

### Pattern 4: Realtime Subscriptions

Use the browser client for realtime features:

```tsx
// src/routes/messages.tsx
import { createEffect, createSignal, onCleanup } from 'solid-js'
import { getSupabaseBrowserClient } from '~/lib/supabase/client'

export default function Messages() {
  const [messages, setMessages] = createSignal([])
  const supabase = getSupabaseBrowserClient()

  createEffect(() => {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        setMessages([...messages(), payload.new])
      })
      .subscribe()

    onCleanup(() => {
      supabase.removeChannel(channel)
    })
  })

  return (
    <div>
      {messages().map((msg) => (
        <div>{msg.content}</div>
      ))}
    </div>
  )
}
```

### Pattern 5: OAuth Authentication

```ts
// src/routes/auth/callback.tsx
import { cache } from '@solidjs/router'
import { getSupabaseServerClient } from '~/lib/supabase/server'

const handleOAuthCallback = cache(async () => {
  'use server'
  const supabase = getSupabaseServerClient()

  // Exchange code for session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    throw redirect('/error')
  }

  throw redirect('/')
}, 'oauth-callback')
```

## Testing

### Unit Testing Server Functions

```ts
// src/lib/supabase/server.test.ts
import { describe, it, expect, vi } from 'vitest'
import { getSupabaseServerClient } from './server'

describe('getSupabaseServerClient', () => {
  it('creates a server client with correct config', () => {
    // Mock Vinxi utilities
    vi.mock('vinxi/http', () => ({
      getHeader: vi.fn(() => ''),
      setCookie: vi.fn()
    }))

    const client = getSupabaseServerClient()
    expect(client).toBeDefined()
  })
})
```

### Integration Testing with Playwright

```ts
// tests/auth.spec.ts
import { test, expect } from '@playwright/test'

test('user can log in', async ({ page }) => {
  await page.goto('/login')

  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/')
  await expect(page.locator('text=Welcome')).toBeVisible()
})
```

## Troubleshooting

### "Invalid JWT" Errors

**Cause:** Session expired and wasn't refreshed.

**Solution:** Ensure middleware is running on every request:
1. Check `src/middleware.ts` exists
2. Verify `updateSession()` is called
3. Check `getUser()` is called (not `getSession()`)

### Session Not Persisting

**Cause:** Cookies aren't being set correctly.

**Solution:**
1. Check `setAll()` implementation in cookie adapter
2. Ensure `setCookie()` from `vinxi/http` is called
3. Verify cookie domain/path settings

### Server Code Bundled in Client

**Cause:** Incorrect use of `"use server"`.

**Solution:**
1. Remove `"use server"` from middleware
2. Only use it in route loaders/actions
3. Check your bundler output for server-only imports

## Summary

SolidStart's approach to SSR authentication is different from Next.js, but follows clear patterns:

1. **Use middleware** for session refresh (without `"use server"`)
2. **Use `"use server"`** in route loaders and actions for data fetching
3. **Always use `getUser()`** for auth checks (never `getSession()`)
4. **Create fresh clients** per request (never global instances)
5. **Use Vinxi's utilities** for cookie handling

By following these patterns, you'll have a secure, performant authentication system in SolidStart.
