---
id: sveltekit
slug: sveltekit
sidebar_label: With SvelteKit
---

# Supabase Auth with SvelteKit

This submodule provides convenience helpers for implementing user authentication in [SvelteKit](https://kit.svelte.dev/) applications.

## Installation

Using [npm](https://npmjs.org):

```sh
npm install @supabase/auth-helpers-sveltekit

# Main component for Svelte based frameworks (optional but recommended)
npm install @supabase/auth-helpers-svelte
```

Using [yarn](https://yarnpkg.com/):

```sh
yarn add @supabase/auth-helpers-sveltekit

# Main component for Svelte based frameworks (optional but recommended)
yarn add @supabase/auth-helpers-svelte
```

This library supports the following tooling versions:

- Node.js: `^16.15.0`

## Getting Started

### Configuration

Set up the fillowing env vars. For local development you can set them in a `.env` file. See an [example](https://github.com/supabase/auth-helpers/blob/main/examples/sveltekit/.env.example).

```bash
# Find these in your Supabase project settings > API
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### SupabaseClient and SupaAuthHelper component setup

We will start off by creating a `db.ts` file inside of our `src/lib` directory. Now lets instantiate our `supabaseClient` by using our `createSupabaseClient` function from the `@supabase/auth-helpers-sveltekit` library.

```ts
// src/lib/db.ts
import { createSupabaseClient } from '@supabase/auth-helpers-sveltekit'

const { supabaseClient } = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
)

export { supabaseClient }
```

Edit your `__layout.svelte` file and add import the `SupaAuthHelper` component, the `supabaseClient` we just instantiated and the `session` store.

```html
// src/routes/__layout.svelte
<script>
  import { session } from '$app/stores'
  import { supabaseClient } from '$lib/db'
  import { SupaAuthHelper } from '@supabase/auth-helpers-svelte'
</script>

<SupaAuthHelper {supabaseClient} {session}>
  <slot />
</SupaAuthHelper>
```

### Hooks setup

Our `hooks.ts` file is where the heavy lifting of this library happens, we need to import our function to handle the sign in, signing out and cookie creation phase. we can import all the hooks using `handleAuth` function and destructure its returned data.

```ts
// src/hooks.ts
import { handleAuth } from '@supabase/auth-helpers-sveltekit'
import type { GetSession, Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

export const handle: Handle = sequence(...handleAuth())

export const getSession: GetSession = async (event) => {
  const { user, accessToken, error } = event.locals
  return {
    user,
    accessToken,
    error,
  }
}
```

These will create the handlers under the hood that perform different parts of the authentication flow:

- `/api/auth/callback`: The `UserHelper` forwards the session details here every time `onAuthStateChange` fires on the client side. This is needed to set up the cookies for your application so that SSR works seamlessly.
- `/api/auth/user`: You can fetch user profile information in JSON format.
- `/api/auth/logout`: You can logout the user.

### Typings

In order to get the most out of TypeScript and its intellisense, you should import our types into the `app.d.ts` type definition file that comes with your SvelteKit project.

```ts
// src/app.d.ts
/// <reference types="@sveltejs/kit" />
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare namespace App {
  interface UserSession {
    user: import('@supabase/supabase-js').User
    accessToken?: string
  }
  interface Locals extends UserSession {
    error: import('@supabase/supabase-js').ApiError
  }

  interface Session extends UserSession {} // interface Platform {} // interface Stuff {}
}
```

### Signing out

This library has provided a dedicated endpoint for you to use to sign a user out. This endpoint will sign the user out of the Gotrue server, clear the cookies that were set when the user logged in and redirect the user to a configurable path.

The logout handler endpoint is `/api/auth/logout`, this will take a `GET` request which means it can be used as the href for a normal `a` tag in your html.

```html
<a href="/api/auth/logout">Sign out</a>
```

### Logout handler configuration

In your `src/hooks.ts` file the logout handler is already setup and you can configure the redirect path from here.

> By default the redirect path after logging out will be `/`.

```ts
export const handle = sequence(
  ...handleAuth({
    logout: { returnTo: '/auth/signin' },
  })
)
```

### Basic Setup

You can now determine if a user is authenticated on the client-side by checking that the `user` object returned by the `$session` store is defined.

```html
// example
<script>
  import { session } from '$app/stores'
</script>

{#if !$session.user}
<h1>I am not logged in</h1>
{:else}
<h1>Welcome {$session.user.email}</h1>
<p>I am logged in!</p>
{/if}
```

## Client-side data fetching with RLS

For [row level security](https://supabase.com/docs/learn/auth-deep-dive/auth-row-level-security) to work properly when fetching data client-side, you need to make sure to import the `{ supabaseClient }` from `@supabase/auth-helpers-sveltekit` and only run your query once the user is defined client-side in the `$session`:

```html
<script>
import Auth from 'supabase-ui-svelte';
import { error, isLoading } from '@supabase/auth-helpers-svelte';
import { supabaseClient } from '$lib/db';
import { session } from '$app/stores';

let loadedData = [];
async function loadData() {
  const { data } = await supabaseClient.from('test').select('*').single();
  loadedData = data
}

$: {
  if ($session.user && $session.user.id) {
    loadData();
  }
}
</script>

{#if !$session.user}
  {#if $error}
    <p>{$error.message}</p>
  {/if}
  <h1>{$isLoading ? `Loading...` : `Loaded!`}</h1>
  <Auth
    supabaseClient={supabaseClient}
    providers={['google', 'github']}
  />
{:else}
  <a href=="/api/auth/logout">Sign out</a>
  <p>user:</p>
  <pre>{JSON.stringify($session.user, null, 2)}</pre>
  <p>client-side data fetching with RLS</p>
  <pre>{JSON.stringify(loadedData, null, 2)}</pre>
{/if}
```

### Server-side data fetching with RLS

For [row level security](https://supabase.com/docs/learn/auth-deep-dive/auth-row-level-security) to work in a server environment, you need to inject the request context into the supabase client:

```html
<!-- src/routes/profile.svelte -->
<script>
  export let user
  export let data
</script>

<div>Protected content for {user.email}</div>
<pre>{JSON.stringify(data, null, 2)}</pre>
<pre>{JSON.stringify(user, null, 2)}</pre>
```

```ts
// src/routes/profile.ts
import {
  supabaseServerClient,
  withApiAuth,
} from '@supabase/auth-helpers-sveltekit'
import type { RequestHandler } from './__types/profile'

interface TestTable {
  id: string
  created_at: string
}

interface GetOutput {
  user: User
  data: TestTable[]
}

export const GET: RequestHandler<GetOutput> = async ({ locals }) =>
  withApiAuth(
    {
      redirectTo: '/',
      user: locals.user,
    },
    async () => {
      const { data } = await supabaseServerClient(session.accessToken)
        .from<TestTable>('test')
        .select('*')

      return {
        body: {
          user: locals.user,
          data,
        },
      }
    }
  )
```

## Protecting API routes

Wrap an API Route to check that the user has a valid session. If they're not logged in the handler will return a
303 and redirect header.

```ts
// src/routes/api/protected-route.ts
import {
  supabaseServerClient,
  withApiAuth,
} from '@supabase/auth-helpers-sveltekit'
import type { RequestHandler } from './__types/protected-route'

interface TestTable {
  id: string
  created_at: string
}

interface GetOutput {
  data: TestTable[]
}

export const GET: RequestHandler<GetOutput> = async ({ locals, request }) =>
  withApiAuth({ user: locals.user }, async () => {
    // Run queries with RLS on the server
    const { data } = await supabaseServerClient(request)
      .from('test')
      .select('*')

    return {
      status: 200,
      body: { data },
    }
  })
```

If you visit `/api/protected-route` without a valid session cookie, you will get a 303 response.
