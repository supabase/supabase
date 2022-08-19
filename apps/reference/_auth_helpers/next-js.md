---
id: next-js
slug: next-js
sidebar_label: With Next.js
---

# Supabase Auth with Next.js

This submodule provides convenience helpers for implementing user authentication in Next.js applications.

## Installation

Using [npm](https://npmjs.org):

```sh
npm install @supabase/auth-helpers-nextjs

# Main components and hooks for React based frameworks (optional)
npm install @supabase/auth-helpers-react
```

Using [yarn](https://yarnpkg.com/):

```sh
yarn add @supabase/auth-helpers-nextjs

# Main components and hooks for React based frameworks (optional)
yarn add @supabase/auth-helpers-react
```

This library supports the following tooling versions:

- Node.js: `^10.13.0 || >=12.0.0`

- Next.js: `>=10`

## Getting Started

### Configuration

Set up the following env vars. For local development you can set them in a `.env.local` file. See an [example](https://github.com/supabase/auth-helpers/blob/main/examples/nextjs/.env.local.example).

```bash
# Find these in your Supabase project settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Basic Setup

- Create an `auth` directory under the `/pages/api/` directory.

- Create a `[...supabase].js` file under the newly created `auth` directory.

The path to your dynamic API route file would be `/pages/api/auth/[...supabase].js`. Populate that file as follows:

```js
import { handleAuth } from '@supabase/auth-helpers-nextjs'

export default handleAuth({ logout: { returnTo: '/' } })
```

Executing `handleAuth()` creates the following route handlers under the hood that perform different parts of the authentication flow:

- `/api/auth/callback`: The `UserProvider` forwards the session details here every time `onAuthStateChange` fires on the client side. This is needed to set up the cookies for your application so that SSR works seamlessly.

- `/api/auth/user`: You can fetch user profile information in JSON format.

- `/api/auth/logout`: Your Next.js application logs out the user. You can optionally pass a `returnTo` parameter to return to a custom relative URL after logout, eg `/api/auth/logout?returnTo=/login`. This will overwrite the logout `returnTo` option specified `handleAuth()`

Wrap your `pages/_app.js` component with the `UserProvider` component:

```jsx
// pages/_app.js
import React from 'react'
import { UserProvider } from '@supabase/auth-helpers-react'
import { supabaseClient } from '@supabase/auth-helpers-nextjs'

export default function App({ Component, pageProps }) {
  return (
    <UserProvider supabaseClient={supabaseClient}>
      <Component {...pageProps} />
    </UserProvider>
  )
}
```

You can now determine if a user is authenticated by checking that the `user` object returned by the `useUser()` hook is defined.

## Client-side data fetching with RLS

For [row level security](https://supabase.com/docs/learn/auth-deep-dive/auth-row-level-security) to work properly when fetching data client-side, you need to make sure to import the `{ supabaseClient }` from `# @supabase/auth-helpers-nextjs` and only run your query once the user is defined client-side in the `useUser()` hook:

```js
import { Auth } from '@supabase/ui'
import { useUser } from '@supabase/auth-helpers-react'
import { supabaseClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'

const LoginPage = () => {
  const { user, error } = useUser()
  const [data, setData] = useState()

  useEffect(() => {
    async function loadData() {
      const { data } = await supabaseClient.from('test').select('*')
      setData(data)
    }
    // Only run query once user is logged in.
    if (user) loadData()
  }, [user])

  if (!user)
    return (
      <>
        {error && <p>{error.message}</p>}
        <Auth
          supabaseClient={supabaseClient}
          providers={['google', 'github']}
          socialLayout="horizontal"
          socialButtonSize="xlarge"
        />
      </>
    )

  return (
    <>
      <button onClick={() => supabaseClient.auth.signOut()}>Sign out</button>
      <p>user:</p>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <p>client-side data fetching with RLS</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  )
}

export default LoginPage
```

### Server-side rendering (SSR) - withPageAuth

If you wrap your `getServerSideProps` with `withPageAuth` your props object will be augmented with the user object.

```js
// pages/profile.js
import { withPageAuth } from '@supabase/auth-helpers-nextjs'

export default function Profile({ user }) {
  return <div>Hello {user.name}</div>
}

export const getServerSideProps = withPageAuth({ redirectTo: '/login' })
```

If there is no authenticated user, they will be redirect to your home page, unless you specify the `redirectTo` option.

You can pass in your own `getServerSideProps` method, the props returned from this will be merged with the
user props. You can also access the user session data by calling `getUser` inside of this method, eg:

```js
// pages/protected-page.js
import { withPageAuth, getUser } from '@supabase/auth-helpers-nextjs'

export default function ProtectedPage({ user, customProp }) {
  return <div>Protected content</div>
}

export const getServerSideProps = withPageAuth({
  redirectTo: '/foo',
  async getServerSideProps(ctx) {
    // Access the user object
    const { user, accessToken } = await getUser(ctx)
    return { props: { email: user?.email } }
  },
})
```

### Server-side data fetching with RLS

For [row level security](https://supabase.com/docs/learn/auth-deep-dive/auth-row-level-security) to work in a server environment, you need to inject the request context into the supabase client:

```js
import {
  User,
  withPageAuth,
  supabaseServerClient,
} from '@supabase/auth-helpers-nextjs'

export default function ProtectedPage({
  user,
  data,
}: {
  user: User,
  data: any,
}) {
  return (
    <>
      <div>Protected content for {user.email}</div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </>
  )
}

export const getServerSideProps = withPageAuth({
  redirectTo: '/',
  async getServerSideProps(ctx) {
    // Run queries with RLS on the server
    const { data } = await supabaseServerClient(ctx).from('test').select('*')
    return { props: { data } }
  },
})
```

### Server-side data fetching to OAuth APIs using `provider_token`

When using third-party auth providers, sessions are initiated with an additional `provider_token` field which is persisted as an HTTPOnly cookie upon logging in to enabled usage on the server side. The `provider_token` can be used to make API requests to the OAuth provider's API endpoints on behalf of the logged-in user. In the following example, we fetch the user's full profile from the third-party API during SSR using their id and auth token:

```js
import { User, withPageAuth, getUser } from '@supabase/auth-helpers-nextjs'

interface Profile {
  /* ... */
}

export default function ProtectedPage({
  user,
  data,
}: {
  user: User,
  profile: Profile,
}) {
  return <div>Protected content</div>
}

export const getServerSideProps = withPageAuth({
  redirectTo: '/',
  async getServerSideProps(ctx) {
    // Retrieve provider_token from cookies
    const provider_token = ctx.req.cookies['sb-provider-token']
    // Get logged in user's third-party id from metadata
    const { user } = await getUser(ctx)
    const userId = user?.user_metadata.provider_id
    const profile: Profile = await (
      await fetch(`https://api.example.com/users/${userId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${provider_token}`,
        },
      })
    ).json()
    return { props: { profile } }
  },
})
```

## Protecting API routes

Wrap an API Route to check that the user has a valid session. If they're not logged in the handler will return a
401 Unauthorized.

```js
// pages/api/protected-route.js
import {
  withApiAuth,
  supabaseServerClient,
} from '@supabase/auth-helpers-nextjs'

export default withApiAuth(async function ProtectedRoute(req, res) {
  // Run queries with RLS on the server
  const { data } = await supabaseServerClient({ req, res })
    .from('test')
    .select('*')
  res.json(data)
})
```

If you visit `/api/protected-route` without a valid session cookie, you will get a 401 response.

## Protecting routes with [Nextjs Middleware](https://nextjs.org/docs/middleware)

As an alternative to protecting individual pages using `getServerSideProps` with `withPageAuth`, `withMiddlewareAuth` can be used from inside a `_middleware` file to protect an entire directory. In the following example, all requests to `/protected/*` will check whether a user is signed in, if successful the request will be forwarded to the destination route, otherwise the user will be redirected to `/login` (defaults to: `/`) with a 307 Temporary Redirect response status:

```ts
// pages/protected/_middleware.ts
import { withMiddlewareAuth } from '@supabase/auth-helpers-nextjs/middleware'

export const middleware = withMiddlewareAuth({ redirectTo: '/login' })
```

It is also possible to add finer granularity based on the user logged in. I.e. you can specify a promise to determine if a specific user has permission or not.

```ts
// pages/protected/_middleware.ts
import { withMiddlewareAuth } from '@supabase/auth-helpers-nextjs/dist/middleware'

export const middleware = withMiddlewareAuth({
  redirectTo: '/login',
  authGuard: {
    isPermitted: async (user) => user.email?.endsWith('@example.com') ?? false,
    redirectTo: '/insufficient-permissions',
  },
})
```

## Migrating from @supabase/supabase-auth-helpers to @supabase/auth-helpers

This is a step by step guide on migrating away from the `@supabase/supabase-auth-helpers` to the newly released `@supabase/auth-helpers`.

1. Install `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs` and `@supabase/auth-helpers-react` libraries from npm.
2. Replace all imports of `@supabase/supabase-auth-helpers/nextjs` in your project with `@supabase/auth-helpers-nextjs`.
3. Replace all imports of `@supabase/supabase-auth-helpers/react` in your project with `@supabase/auth-helpers-react`.
4. Replace all instances of `withAuthRequired` in any of your NextJS pages with `withPageAuth`.
5. Replace all instances of `withAuthRequired` in any of your NextJS API endpoints with `withApiAuth`.
6. Uninstall `@supabase/supabase-auth-helpers`.
