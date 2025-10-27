---
title = "OAuth sign in isn't redirecting on the server side"
github_url = "https://github.com/orgs/supabase/discussions/15862"
date_created = "2023-07-18T12:28:55+00:00"
topics = [ "auth" ]
keywords = [ "oauth", "redirects", "server-side" ]
database_id = "3e9246cb-d592-4051-93c8-53e4e555711c"
---

The reason behind this limitation is that the auth helpers library lacks a direct mechanism for performing server-side redirects, as each framework handles redirects differently. However, the library does offer a URL through the data property it returns, which should be utilized for the purpose of redirection.

**Next.js:**

```ts
import { NextResponse } from "next/server";
...
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'github',
})

return NextResponse.redirect(data.url)
```

**SvelteKit:**

```ts
import { redirect } from '@sveltejs/kit';
...
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'github',
})

throw redirect(303, data.url)
```

**Remix:**

```ts
import { redirect } from "@remix-run/node"; // or cloudflare/deno
...
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'github',
})

return redirect(data.url)
```
