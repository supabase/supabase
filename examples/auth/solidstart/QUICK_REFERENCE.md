# SolidStart + Supabase - Quick Reference

## Installation

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install @solidjs/start @solidjs/router solid-js vinxi
```

## Environment Variables

```bash
# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## File Structure

```text
src/
├── middleware.ts                 # Session refresh on every request
├── lib/
│   └── supabase/
│       ├── client.ts             # Browser client
│       ├── server.ts             # Server client
│       └── middleware.ts         # Middleware helper
└── routes/
    ├── index.tsx                 # Public page
    ├── login.tsx                 # Login page
    ├── logout.tsx                # Logout endpoint
    └── protected.tsx             # Protected page
```

## Code Snippets

### 1. Browser Client

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function getSupabaseBrowserClient() {
  return createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  )
}
```

**Use for:**
- Realtime subscriptions
- Client-side queries (public data)
- Auth state monitoring

### 2. Server Client

```ts
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { getCookie, getHeader, setCookie } from 'vinxi/http'

export function getSupabaseServerClient() {
  return createServerClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = getHeader('Cookie') ?? ''
          return cookieHeader
            .split(';')
            .map((cookie) => {
              const [name, ...rest] = cookie.trim().split('=')
              return { name, value: rest.join('=') }
            })
            .filter((cookie) => cookie.name)
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            setCookie(name, value, options)
          })
        },
      },
    }
  )
}
```

**Use for:**
- Route loaders (with `"use server"`)
- Server actions (with `"use server"`)
- Authentication checks
- Protected queries

### 3. Middleware

```ts
// src/middleware.ts
import { createMiddleware } from '@solidjs/start/middleware'
import { updateSession } from '~/lib/supabase/middleware'

export default createMiddleware({
  onRequest: [
    async (event) => {
      await updateSession()
    },
  ],
})
```

```ts
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { getCookie, getHeader, setCookie } from 'vinxi/http'

export async function updateSession() {
  const supabase = createServerClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = getHeader('Cookie') ?? ''
          return cookieHeader
            .split(';')
            .map((cookie) => {
              const [name, ...rest] = cookie.trim().split('=')
              return { name, value: rest.join('=') }
            })
            .filter((cookie) => cookie.name)
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            setCookie(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.getUser()
}
```

### 4. Protected Route

```tsx
// src/routes/protected.tsx
import { createAsync, query, redirect } from '@solidjs/router'
import { getSupabaseServerClient } from '~/lib/supabase/server'

const getUser = query(async () => {
  'use server'
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw redirect('/login')
  }

  return user
}, 'protected-user')

export const route = {
  load: () => getUser()
}

export default function Protected() {
  const user = createAsync(() => getUser())

  return (
    <main>
      <h1>Protected Page</h1>
      <p>Email: {user()?.email}</p>
    </main>
  )
}
```

### 5. Login Page

```tsx
// src/routes/login.tsx
import { action, redirect, useAction } from '@solidjs/router'
import { getSupabaseServerClient } from '~/lib/supabase/server'

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

export default function Login() {
  const login = useAction(loginAction)

  return (
    <main>
      <h1>Sign In</h1>
      <form action={login} method="post">
        <input name="email" type="email" required />
        <input name="password" type="password" required />
        <button type="submit">Sign In</button>
      </form>
    </main>
  )
}
```

### 6. Logout Endpoint

```tsx
// src/routes/logout.tsx
import { action, redirect } from '@solidjs/router'
import { getSupabaseServerClient } from '~/lib/supabase/server'

export const POST = action(async () => {
  'use server'
  const supabase = getSupabaseServerClient()
  await supabase.auth.signOut()
  throw redirect('/')
})

export default function Logout() {
  return null
}
```

### 7. Public Page with Conditional Content

```tsx
// src/routes/index.tsx
import { A } from '@solidjs/router'
import { createAsync, query } from '@solidjs/router'
import { Show } from 'solid-js'
import { getSupabaseServerClient } from '~/lib/supabase/server'

const getUser = query(async () => {
  'use server'
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}, 'user')

export const route = {
  load: () => getUser()
}

export default function Home() {
  const user = createAsync(() => getUser())

  return (
    <main>
      <Show
        when={user()}
        fallback={<A href="/login">Sign In</A>}
      >
        <p>Welcome, {user()?.email}!</p>
        <A href="/logout">Sign Out</A>
      </Show>
    </main>
  )
}
```

### 8. Signup Page

```tsx
// src/routes/signup.tsx
import { action, redirect, useAction } from '@solidjs/router'
import { getSupabaseServerClient } from '~/lib/supabase/server'

const signupAction = action(async (formData: FormData) => {
  'use server'
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = getSupabaseServerClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  throw redirect('/login?message=Check your email to confirm')
})

export default function Signup() {
  const signup = useAction(signupAction)

  return (
    <main>
      <h1>Sign Up</h1>
      <form action={signup} method="post">
        <input name="email" type="email" required />
        <input name="password" type="password" required />
        <button type="submit">Sign Up</button>
      </form>
    </main>
  )
}
```

### 9. Fetching User Data

```tsx
// src/routes/profile.tsx
import { createAsync, query, redirect } from '@solidjs/router'
import { getSupabaseServerClient } from '~/lib/supabase/server'

const getProfile = query(async () => {
  'use server'
  const supabase = getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
}, 'profile')

export const route = {
  load: () => getProfile()
}

export default function Profile() {
  const data = createAsync(() => getProfile())

  return (
    <main>
      <h1>Profile</h1>
      <p>Email: {data()?.user.email}</p>
      <p>Name: {data()?.profile?.name}</p>
    </main>
  )
}
```

### 10. Realtime Subscription

```tsx
// src/routes/messages.tsx
import { createEffect, createSignal, onCleanup } from 'solid-js'
import { For } from 'solid-js'
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
      <For each={messages()}>
        {(msg) => <div>{msg.content}</div>}
      </For>
    </div>
  )
}
```

## Common Patterns

### Pattern: Error Handling

```tsx
const getUser = query(async () => {
  'use server'
  const supabase = getSupabaseServerClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Auth error:', error.message)
    throw redirect('/login')
  }

  return user
}, 'user')
```

### Pattern: Loading States

```tsx
export default function MyRoute() {
  const data = createAsync(() => getData())

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Show when={data()}>
        <div>{data()?.content}</div>
      </Show>
    </Suspense>
  )
}
```

### Pattern: Form Submission with Error Display

```tsx
const submitAction = action(async (formData: FormData) => {
  'use server'
  // ... process form

  if (error) {
    return { error: error.message }
  }

  throw redirect('/success')
})

export default function MyForm() {
  const submit = useAction(submitAction)
  const [result, setResult] = createSignal<{ error?: string }>()

  const handleSubmit = async (e: Event) => {
    const formData = new FormData(e.target as HTMLFormElement)
    const res = await submit(formData)
    setResult(res)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ... form fields ... */}
      <Show when={result()?.error}>
        <p style={{ color: 'red' }}>{result()?.error}</p>
      </Show>
      <button type="submit">Submit</button>
    </form>
  )
}
```

## Cheat Sheet

### ✅ DO

- ✅ Use `getUser()` for auth checks
- ✅ Create fresh clients per request
- ✅ Use `"use server"` in loaders/actions
- ✅ Use `query()` for deduplication
- ✅ Protect routes at loader level
- ✅ Use middleware for session refresh
- ✅ Handle errors gracefully
- ✅ Use browser client for realtime
- ✅ Use server client for auth

### ❌ DON'T

- ❌ Use `getSession()` for auth checks
- ❌ Create global client instances
- ❌ Use `"use server"` in middleware
- ❌ Trust client-side auth state
- ❌ Skip error handling
- ❌ Forget to call middleware
- ❌ Mix browser and server clients
- ❌ Store credentials in cookies manually

## Debugging

### Check if middleware is running

```ts
// src/middleware.ts
export default createMiddleware({
  onRequest: [
    async (event) => {
      console.log('Middleware running for:', event.request.url)
      await updateSession()
    },
  ],
})
```

### Check if session is being refreshed

```ts
// src/lib/supabase/middleware.ts
export async function updateSession() {
  const supabase = createServerClient(/* ... */)

  const { data, error } = await supabase.auth.getUser()
  console.log('Session refresh:', { user: data.user?.email, error })
}
```

### Check cookies in browser

1. Open DevTools → Application/Storage → Cookies
2. Look for `sb-<project-ref>-auth-token`
3. Check value, expiry, HttpOnly flag

### Check cookies in response

1. Open DevTools → Network
2. Click on any request
3. Look at Response Headers → Set-Cookie
4. Verify token is being updated

## Resources

- [SolidStart Docs](https://docs.solidjs.com/solid-start)
- [Solid Router API](https://docs.solidjs.com/solid-router)
- [Supabase Docs](https://supabase.com/docs)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Vinxi Docs](https://vinxi.vercel.app/)

## Support

If you encounter issues:

1. Check that middleware is running
2. Verify environment variables are set
3. Ensure `getUser()` is used (not `getSession()`)
4. Check browser console for errors
5. Check server console for errors
6. Verify cookies are being set in DevTools

For more detailed help, see [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).
