# SolidStart + Supabase Authentication Architecture

## Request Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        User Request to /protected                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         1. Middleware Layer                             │
│  src/middleware.ts                                                      │
│                                                                         │
│  export default createMiddleware({                                      │
│    onRequest: [                                                         │
│      async (event) => {                                                 │
│        await updateSession() ◄─── Calls session refresh                │
│      }                                                                  │
│    ]                                                                    │
│  })                                                                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    2. Session Refresh (middleware.ts)                   │
│  src/lib/supabase/middleware.ts                                         │
│                                                                         │
│  export async function updateSession() {                                │
│    const supabase = createServerClient(...)                             │
│                                                                         │
│    // Validates JWT + refreshes if expired                             │
│    await supabase.auth.getUser() ◄─── JWT validation happens here      │
│                                                                         │
│    // If token expired:                                                │
│    //   1. Supabase refreshes it automatically                         │
│    //   2. setAll() is called with new token                           │
│    //   3. setCookie() writes new token to response                    │
│  }                                                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         3. Route Loader                                 │
│  src/routes/protected.tsx                                               │
│                                                                         │
│  const getUser = query(async () => {                                    │
│    'use server' ◄─── Marks this as server-only RPC                     │
│                                                                         │
│    const supabase = getSupabaseServerClient()                           │
│    const { data: { user } } = await supabase.auth.getUser()            │
│                                                                         │
│    if (!user) {                                                         │
│      throw redirect('/login') ◄─── Server-side redirect                │
│    }                                                                    │
│                                                                         │
│    return user                                                          │
│  }, 'protected-user')                                                   │
│                                                                         │
│  export const route = {                                                 │
│    load: () => getUser() ◄─── Runs on server before render             │
│  }                                                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      4. Server Client Creation                          │
│  src/lib/supabase/server.ts                                             │
│                                                                         │
│  export function getSupabaseServerClient() {                            │
│    return createServerClient(                                           │
│      import.meta.env.VITE_SUPABASE_URL!,                                │
│      import.meta.env.VITE_SUPABASE_ANON_KEY!,                           │
│      {                                                                  │
│        cookies: {                                                       │
│          getAll() {                                                     │
│            // Parse 'Cookie' header using Vinxi                         │
│            const cookieHeader = getHeader('Cookie') ?? ''               │
│            return cookieHeader.split(';').map(...) ◄─── Read cookies    │
│          },                                                             │
│          setAll(cookiesToSet) {                                         │
│            // Write cookies using Vinxi                                 │
│            cookiesToSet.forEach(({ name, value, options }) => {         │
│              setCookie(name, value, options) ◄─── Write cookies         │
│            })                                                           │
│          }                                                              │
│        }                                                                │
│      }                                                                  │
│    )                                                                    │
│  }                                                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         5. Component Render                             │
│  src/routes/protected.tsx                                               │
│                                                                         │
│  export default function Protected() {                                  │
│    const user = createAsync(() => getUser())    │
│                                                                         │
│    return (                                                             │
│      <main>                                                             │
│        <h1>Protected Page</h1>                                          │
│        <p>Your email: {user()?.email}</p> ◄─── Render user data        │
│      </main>                                                            │
│    )                                                                    │
│  }                                                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     6. Response with Updated Cookies                    │
│                                                                         │
│  HTTP/1.1 200 OK                                                        │
│  Set-Cookie: sb-xxx-auth-token=<refreshed_token>; Path=/; HttpOnly     │
│  Content-Type: text/html                                                │
│                                                                         │
│  <html>...</html>                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Client vs Server Client

### Browser Client (Client-Side)

```
┌─────────────────────────────────────────────────────┐
│  Component (Client-Side)                            │
│  src/routes/messages.tsx                            │
│                                                     │
│  import { getSupabaseBrowserClient }                │
│         from '~/lib/supabase/client'                │
│                                                     │
│  export default function Messages() {               │
│    const supabase = getSupabaseBrowserClient()      │
│                                                     │
│    // Used for:                                     │
│    // - Realtime subscriptions                     │
│    // - Client-side queries (public data)          │
│    // - Auth state changes                         │
│                                                     │
│    createEffect(() => {                             │
│      supabase                                       │
│        .channel('messages')                         │
│        .on('postgres_changes', ...)                 │
│        .subscribe()                                 │
│    })                                               │
│  }                                                  │
└─────────────────────────────────────────────────────┘
```

**Browser Client:**
- ✅ Use for realtime subscriptions
- ✅ Use for public data queries
- ✅ Use for auth state monitoring
- ❌ Don't use for initial SSR data (user won't be available)
- ❌ Don't use for protected API calls (session may not be loaded yet)

### Server Client (Server-Side)

```
┌─────────────────────────────────────────────────────┐
│  Route Loader (Server-Side)                         │
│  src/routes/dashboard.tsx                           │
│  import { query } from '@solidjs/router'                                                  │
│  import { getSupabaseServerClient }                 │
│         from '~/lib/supabase/server'                │
│                                                     │
│  const getDashboardData = query(async () => {       │
│    'use server'                                     │
│                                                     │
│    const supabase = getSupabaseServerClient()       │
│                                                     │
│    // Used for:                                     │
│    // - Fetching user data                         │
│    // - Protected queries                          │
│    // - Server-side mutations                      │
│    // - Auth checks                                │
│                                                     │
│    const { data } = await supabase                  │
│      .from('user_data')                             │
│      .select('*')                                   │
│                                                     │
│    return data                                      │
│  }, 'dashboard')                                    │
└─────────────────────────────────────────────────────┘
```

**Server Client:**
- ✅ Use in loaders with `"use server"`
- ✅ Use in actions with `"use server"`
- ✅ Use for authentication checks
- ✅ Use for protected data fetching
- ❌ Don't create in global scope (must be per-request)
- ❌ Don't use in middleware (create separate middleware client)

## Cookie Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                         Cookie Lifecycle                           │
└────────────────────────────────────────────────────────────────────┘

1. User Signs In
   ↓
   POST /login
   {
     email: "user@example.com",
     password: "****"
   }
   ↓
   supabase.auth.signInWithPassword({ email, password })
   ↓
   Supabase returns session with JWT
   ↓
   setAll() is called with new cookie
   ↓
   setCookie('sb-xxx-auth-token', token, { httpOnly: true, ... })
   ↓
   Response: Set-Cookie header sent to browser
   ↓
   Browser stores cookie

2. Subsequent Requests
   ↓
   GET /protected
   Cookie: sb-xxx-auth-token=<current_token>
   ↓
   Middleware runs: updateSession()
   ↓
   getHeader('Cookie') returns 'sb-xxx-auth-token=<current_token>'
   ↓
   getAll() parses into [{ name: 'sb-xxx-auth-token', value: '<current_token>' }]
   ↓
   createServerClient reads cookies
   ↓
   supabase.auth.getUser() validates JWT
   ↓
   If expired:
     ├─ Supabase calls refresh endpoint
     ├─ Gets new JWT
     ├─ Calls setAll() with new token
     └─ setCookie() writes new token to response
   ↓
   Route loader runs with fresh session
   ↓
   Response includes updated Set-Cookie if refreshed

3. User Signs Out
   ↓
   GET /logout
   ↓
   supabase.auth.signOut()
   ↓
   setAll() is called to clear cookie
   ↓
   setCookie('sb-xxx-auth-token', '', { maxAge: 0 })
   ↓
   Response: Set-Cookie with empty value and past expiry
   ↓
   Browser deletes cookie
```

## Comparison: Next.js vs SolidStart

### Next.js Architecture

```
┌────────────────────────────────────────────┐
│  Middleware (middleware.ts)                │
│  - Runs on Edge Runtime                    │
│  - Uses NextRequest/NextResponse            │
│  - Can't write cookies from Server         │
│    Components (requires Proxy pattern)     │
└────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────┐
│  Proxy (middleware.ts)                     │
│  - Refreshes tokens                        │
│  - Sets cookies via response.cookies.set() │
│  - Passes to Server Components via         │
│    request.cookies.set()                   │
└────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────┐
│  Server Component                          │
│  - Automatically runs on server            │
│  - Uses cookies() from next/headers        │
│  - Can't set cookies (read-only)           │
└────────────────────────────────────────────┘
```

### SolidStart Architecture

```
┌────────────────────────────────────────────┐
│  Middleware (src/middleware.ts)            │
│  - Runs on Node.js runtime                 │
│  - Uses Vinxi HTTP utilities               │
│  - CAN write cookies via setCookie()       │
│  - No Proxy pattern needed                 │
└────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────┐
│  Route Loader (with "use server")          │
│  - Explicitly marked as server-only        │
│  - Uses getSupabaseServerClient()          │
│  - Can read AND write cookies              │
└────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────┐
│  Component (renders on server + hydrates)  │
│  - Uses createAsync() to access loader     │
│  - Gets data from server-side fetch        │
│  - Hydrates on client                      │
└────────────────────────────────────────────┘
```

**Key Differences:**

1. **No Proxy Pattern**: SolidStart middleware can write cookies directly
2. **Explicit "use server"**: Must mark server functions explicitly (not automatic)
3. **Vinxi Runtime**: Uses Vinxi instead of Next.js Edge Runtime
4. **Simpler Cookie API**: Direct access via `getCookie`/`setCookie` (no `cookies()` helper)

## Security Model

```
┌──────────────────────────────────────────────────────────────────┐
│                      Defense in Depth                            │
└──────────────────────────────────────────────────────────────────┘

Layer 1: Cookie Security
├─ HttpOnly flag (prevents XSS access)
├─ Secure flag (HTTPS only)
├─ SameSite=Lax (prevents CSRF)
└─ Short expiry (1 hour default)

Layer 2: JWT Validation
├─ getUser() validates signature on EVERY call
├─ Checks against Supabase public keys
├─ Verifies expiry timestamp
└─ Validates issuer and audience

Layer 3: Row Level Security (RLS)
├─ Enforced at database level
├─ auth.uid() extracts user from JWT
├─ Policies checked on every query
└─ Works even if server code has bugs

Layer 4: Server-Side Checks
├─ Never trust client-side auth state
├─ Always check in loaders (server-side)
├─ Use redirect() for unauthorized access
└─ Log auth failures for monitoring
```

### Why getUser() is Secure

```
┌─────────────────────────────────────────────────────────────┐
│  getSession() - ❌ INSECURE                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  const { data: { session } } =                              │
│    await supabase.auth.getSession()                         │
│                                                             │
│  What it does:                                              │
│  1. Reads cookie from request                               │
│  2. Decodes JWT (no validation!)                            │
│  3. Returns session data                                    │
│                                                             │
│  Attack vector:                                             │
│  - Attacker crafts fake JWT                                 │
│  - Sets cookie to fake JWT                                  │
│  - Server accepts without validation                        │
│  - Attacker impersonates any user!                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  getUser() - ✅ SECURE                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  const { data: { user } } =                                 │
│    await supabase.auth.getUser()                            │
│                                                             │
│  What it does:                                              │
│  1. Reads JWT from cookie                                   │
│  2. Fetches public keys from Supabase                       │
│  3. Validates JWT signature cryptographically               │
│  4. Checks expiry, issuer, audience                         │
│  5. Returns user data ONLY if valid                         │
│                                                             │
│  Security:                                                  │
│  - Fake JWTs rejected (invalid signature)                   │
│  - Expired tokens rejected                                  │
│  - Tampered tokens detected                                 │
│  - Safe for authentication checks                           │
└─────────────────────────────────────────────────────────────┘
```

## Performance Considerations

### Query Function Benefits

without query():

Request arrives

Route loader calls getUser() → Query 1
Component calls getUser() → Query 2
Nested component calls getUser() → Query 3

Result: 3 identical database queries
Time: ~300ms

WITH query():

Request arrives

Route loader calls getUser() → Query 1
Component calls getUser() → Cached
Nested component calls getUser() → Cached

query hits

Result: 1 query executed instead of 3
Time: ~100ms
                                  |

### Middleware Performance

```
Middleware runs on EVERY request:
├─ Static assets: /_build/assets/index.css
├─ API routes: /api/data
├─ Page routes: /dashboard
└─ Fonts/images: /fonts/inter.woff2

Optimization: Skip middleware for static assets
┌──────────────────────────────────────────┐
│  export default createMiddleware({       │
│    onRequest: [                          │
│      async (event) => {                  │
│        const url = new URL(...)          │
│                                          │
│        // Skip for static files          │
│        if (url.pathname.startsWith('/_'))│
│          return                          │
│                                          │
│        await updateSession()             │
│      }                                   │
│    ]                                     │
│  })                                      │
└──────────────────────────────────────────┘
```

## Troubleshooting Flowchart

```
┌─────────────────────────────────────────┐
│  "Invalid JWT" error                    │
└────────────────┬────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Is middleware │ NO ──→ Add src/middleware.ts
         │   running?    │        with updateSession()
         └───────┬───────┘
                 │ YES
                 ▼
         ┌───────────────┐
         │ Does it call  │ NO ──→ Call await supabase.auth
         │  getUser()?   │        .getUser() in middleware
         └───────┬───────┘
                 │ YES
                 ▼
         ┌───────────────┐
         │ Are cookies   │ NO ──→ Check setAll() calls
         │ being set?    │        setCookie() correctly
         └───────┬───────┘
                 │ YES
                 ▼
         ┌───────────────┐
         │ Check browser │────→ Look for Set-Cookie
         │ DevTools      │      in response headers
         └───────────────┘
```

## Summary

This architecture provides:
- ✅ **Automatic session refresh** via middleware
- ✅ **Secure auth checks** via `getUser()` JWT validation
- ✅ **Server-side protection** via route loaders
- ✅ **Efficient data fetching** via query functions
- ✅ **Type safety** throughout the stack
- ✅ **Defense in depth** with multiple security layers

All while being simpler than Next.js (no Proxy pattern needed) and more explicit than SvelteKit (clear `"use server"` markers).
