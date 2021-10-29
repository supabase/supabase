---
title: 'Move authentication logic to Next.js 12 middleware'
author: mgm1313
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/9018689?u=e685d987bcff1d15f40211aba826dd09ccd7a600&v=4
author_url: https://github.com/mgm1313
category: General
upvoteCount: 3
commentCount: 2
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Now that [Next.js 12 introduces middleware](https://nextjs.org/blog/next-12#introducing-middleware) it would be cool if we could move the authentication workflow to this middleware layer.

**Current situation**
At this time when requiring server-side authentication the workflow would be to set up an auth cookie via for example an api route.

[`pages/api/auth.js`](https://github.com/vercel/next.js/blob/46ddd8cf6016bd74b98a6f627149c95fa59244ed/examples/with-supabase-auth-realtime-db/pages/api/auth.js)

`js
import { supabase } from '../../lib/initSupabase'

export default function handler(req, res) {
supabase.auth.api.setAuthCookie(req, res)
}

`

which get's called inside the `onAuthStateChanged` method.

Now to create a protected route, we currently check if the user object obtained via `getUserByCookie` is not empty inside the `getServerSideProps` method of that page.

[`pages/protected.js`](https://github.com/vercel/next.js/blob/46ddd8cf6016bd74b98a6f627149c95fa59244ed/examples/with-supabase-auth-realtime-db/pages/profile.js#L31)

`js
export async function getServerSideProps({ req }) {
const { user } = await supabase.auth.api.getUserByCookie(req)

if (!user) {
// If no user, redirect to index.
return { props: {}, redirect: { destination: '/', permanent: false } }
}

// If there is a user, return it.
return { props: { user } }
}

`

**Advantages to using middleware**
When using the new middleware functionality in Next.js 12 I see three main advantages for my own use-case:

1. No more repetitive code; currently I need to copy-paste the `getServerSideProps` method into all page files that are protected
2. Less risk on forgetting to protect a route; e.q. to protect all routes inside the `/dashboard` folder I'd simply have to setup a single `_middleware.js` file inside the `/pages/dashboard` folder containing the authentication logic.
3. Possibly faster page loads; since the authentication logic runs at the edge instead of on the server.

**How to get this to work?**
I tried setting up a middleware layer through the following code:

`_middleware.ts`

```ts
import type { NextRequest } from 'next/server'

import { supabase } from '@/utils/initSupabase'

function jsonResponse(status: number, data: any, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    status,
    headers: {
      ...init?.headers,
      'Content-Type': 'application/json',
    },
  })
}

async function verifyAuth(request: NextRequest) {
  const { user, error } = await supabase.auth.api.getUserByCookie(request)

  if (!user) {
    return jsonResponse(401, { error: { message: error?.message } })
  }

  return
}

export async function middleware(req: NextRequest) {
  return await verifyAuth(req)
}
```

But this leads to an `XMLHttpRequest is not defined` error inside the `getUser()` method, I guess because those kinds of requests can't be made inside the V8 engine that edge functions are using.
So is it actually currently possible to use Next.js middleware to authenticate users via Supabase, to achieve above use-case?

---

<a href="https://github.com/supabase/supabase/discussions/3680#discussioncomment-1546582" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/mgm1313" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/9018689?u=e685d987bcff1d15f40211aba826dd09ccd7a600&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">mgm1313</span>
    <span style={{ color: '#8b949e' }}>2 days ago</span>
  </span>
  </a>
  </div>
  So I dug a little more into this; and had quite the guidance from the [jwt-authentication](https://github.com/vercel/examples/tree/main/edge-functions/jwt-authentication) Vercel example.

So since I'm not interested in the actual user object, I can just verify the JWT token using my own JWT-secret (which can be obtained from the Supabase dashboard under 'Settings' > 'API' > 'Config' > 'JWT Secret' ).
To verify the token in the V8 runtime ([which edge functions use](https://nextjs.org/docs/api-reference/edge-runtime)) you can for example use the [`@tsndr/cloudflare-worker-jwt`](https://www.npmjs.com/package/@tsndr/cloudflare-worker-jwt) package, as Vercel does in her example.

So I ended up with the following `_middleware.ts` file inside my `pages/dashboard` folder.

```ts
import jwt from '@tsndr/cloudflare-worker-jwt'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Verifies the user's JWT token and returns the payload if
 * it's valid or a response if it's not.
 */
export async function middleware(request: NextRequest) {
  const token = request.cookies['sb:token'] //'sb:token' is the default cookie name

  if (!token || !(await jwt.verify(token, process.env.SUPABASE_JWT_SECRET!))) {
    return NextResponse.redirect('/', 302) // If a user is not authenticated (either no token was send, or the token is invalid) redirect the user to the homepage where they will be presented with a log-in screen
  }

  return NextResponse.next() // continue the middleware chain https://nextjs.org/docs/api-reference/next/server#nextresponse
}
```

Now I was able to remove all `getServerSideProps` methods throughout my app, and achieve the advantages I [mentioned earlier](https://github.com/supabase/supabase/discussions/3680#discussion-3652380) 🥳

  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">3</span></p>
    <p>0 replies</p>
  </div>
</details>
