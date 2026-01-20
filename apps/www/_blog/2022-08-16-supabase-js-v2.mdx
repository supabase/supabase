---
title: 'supabase-js v2'
description: A look at supabase-js v2, which brings type support and focuses on quality-of-life improvements for developers.
author: inian,alaister
imgSocial: lw5-supabase-js/thumb.jpg
imgThumb: lw5-supabase-js/thumb.jpg
categories:
  - product
tags:
  - launch-week
date: '2022-08-16'
toc_depth: 3
video: https://www.youtube.com/v/iqZlPtl_b-I
---

<div className="bg-gray-300 rounded-lg p-6 italic">
<br /> ⚠️ UPDATED 20/10: supabase-js v2 is fully released 🥳<br />

[Check the updated docs](https://supabase.com/docs/reference/javascript) and [migration guide](https://supabase.com/docs/reference/javascript/v1/upgrade-guide).

</div>

Today we're publishing a release candidate for [supabase-js v2](https://github.com/supabase/supabase-js), which focuses on “quality-of-life” improvements for developers.

Try it out by running `npm i @supabase/supabase-js@rc`

Nearly 2 years ago we [released supabase-js v1](https://supabase.com/blog/improved-dx).
Since then it has been used in over [17K repositories](https://github.com/supabase/supabase-js/network/dependents?package_id=UGFja2FnZS04MjM3OTUyMDU%3D) and has grown
to [50K weekly downloads](https://www.npmjs.com/package/@supabase/supabase-js). Supabase users give a lot of great feedback and we've
learned some of the largest pain-points as a result.

## Major Updates

This release focuses on solving these pain-points. At the same time we want to make the upgrade path for supabase-js as easy as possible,
so we've been strategic about the changes we're making. We plan to follow this model going forward: incremental changes over huge rewrites.

### Type support

If you followed yesterday's announcement, you will have noticed that we added
[type generators](https://supabase.com/docs/reference/cli/usage#supabase-gen-types) to the CLI.

```bash
supabase start
supabase gen types typescript --local > DatabaseDefinitions.ts
```

These types can now be used to enrich your development experience:

```tsx
import type { Database } from './DatabaseDefinitions'

const supabase = createClient<Database>(SUPABASE_URL, ANON_KEY)

const { data } = await supabase.from('messages').select().match({ id: 1 })
```

<details>

<summary>ℹ️ Differences from v1</summary>

v1 also supported types, but the types were generated from the API rather than the database, so it
lost a lot of detailed information. The library also required you to specify the definition in
every method call, rather than at the client level.

```
supabase.from<Database['Message']>('messages').select('*')
```

</details>

---

### New Auth methods

We're removing the `signIn()` method in favor of more explicit method signatures:
`signInWithPassword()`, and `signInWithOtp()`.

```ts
// v2
const { data } = await supabase.auth.signInWithPassword({
  email: 'hello@example',
  password: 'pass',
})

// v1
const { data } = await supabase.auth.signIn({
  email: 'hello@example',
  password: 'pass',
})
```

This helps with type hinting. Previously it was difficult for developers to know what they were missing.
A lot of developers didn't even realize they could use passwordless magic links.

---

### Data methods return minimal by default

The `insert()`, `update()`, and `upsert()` methods now require you to explicitly append `select()` if you want the data to be returned.

```ts
// v2
const { data } = await supabase.from('messages').insert({ id: 1, message: 'Hello world' }).select() // select is now explicitly required

// v1
const { data } = await supabase.from('messages').insert({ id: 1, message: 'Hello world' }) // insert would also "select()"
```

This was another common question in our GitHub Discussions. While the idea of automatically returning data is great,
developers often turn on Row Level Security (which is great), and then they forget to add a `select` Policy.
It is a bit surprising that you need to add a `select` policy to do an `insert`, so we opted for the “principle of least surprise”.
If you don't append `select()`, the `data` value will be an empty object: `{}`.

<details>

<summary>ℹ️ Differences from v1</summary>

Previously you could pass a `returning: 'minimal'` option to the `insert()`, `update()`, and
`upsert()` statements. We've now made this the default behaviour.

</details>

---

### Auth Admin methods

We've move all server-side Auth methods from `supabase.auth.api` to `supabase.auth.admin`:

```ts
// v2
const { data: user, error } = await supabase.auth.admin.listUsers()

// v1
const { data: user, error } = await supabase.auth.api.listUsers()
```

All `admin` methods expect a `SERVICE_ROLE` key.
This change makes it clear that any methods under the `admin` namespace should only be used on a trusted server-side environment.

---

### Async Auth overhaul

We've rebuilt the Auth library, making it async for almost all methods.

```ts
// v2
const { data } = await supabase.auth.getSession()

// v1
const { data } = supabase.auth.session()
```

This solves the “getting logged out” issue, which has been a recurring challenge in our GitHub Discussions.

<details>

<summary>ℹ️ Improvements from v1</summary>

The previous implementation had a race condition when refreshing the auth token across multiple tabs. The async re-write forces the library to wait
for a valid/invalid session before taking any action.

</details>

---

### Scoped constructor config

We're being much more explicit about the modular approach that `supabase-js` uses:

```ts
const supabase = createClient(apiURL, apiKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  realtime: {
    channels,
    endpoint,
  },
  // common across all libraries
  global: {
    fetch: customFetch,
    headers: DEFAULT_HEADERS,
  },
})
```

This is clearer for developers - if you're only using some parts of Supabase, you only receive the hints for those parts.

<details>

<summary>ℹ️ Improvements from v1</summary>

We noticed a lot of confusion for the variable naming between each library.
For example, Auth has a config parameter called "storageKey", which was was often confused with the `storage-js` library bundled in the `supabase-js` library.

</details>

---

### Better Errors

We've created error types for all of the sub-libraries in `supabase-js`. Here's a example for Edge Functions:

```ts
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js'

const { data: user, error } = await supabase.functions.invoke('hello')

if (error instanceof FunctionsHttpError) {
  console.log('Function returned an error', error.message)
} else if (error instanceof FunctionsRelayError) {
  console.log('Relay error:', error.message)
} else if (error instanceof FunctionsFetchError) {
  console.log('Fetch error:', error.message)
}
```

---

### Improvements for Edge Functions

`supabase-js` now automatically detects the content type for the request/response bodies for all Edge Function invocations:

```ts
// v2
const { data: user, error } = await supabase.functions.invoke('hello', {
  body: { foo: 'bar' },
})

// v1
const { data: user, error } = await supabase.functions.invoke('hello', {
  headers: { 'Content-Type': 'application/json' }
  body: JSON.stringify({ foo: 'bar' }),
})
```

This improvement inspired by a Supabase community member. Thanks [@vejja](https://github.com/supabase/functions-js/pull/23)!

---

### Multiplayer Sneak Peek

There is a new `channel()` interface which are releasing in v2.
This is a "preparatory" release for our upcoming [multiplayer](https://supabase.com/blog/supabase-realtime-with-multiplayer-features) features.

```ts
supabase
  .channel('any_string_you_want')
  .on('presence', { event: 'track' }, (payload) => {
    console.log(payload)
  })
  .subscribe()
```

As part of this change, the old `from().on().subscribe()` method for listening to database changes will be changing:

```ts
// v2
supabase
  .channel('any_string_you_want')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'movies',
    },
    (payload) => {
      console.log(payload)
    }
  )
  .subscribe()

// v1
supabase
  .from('movies')
  .on('INSERT', (payload) => {
    console.log(payload)
  })
  .subscribe()
```

You can listen to PostgreSQL database changes on any channel you want by subscribing to the `'postgres_changes'` event.
For now, we will continue to support `from().on().subscribe()`, but in the future we will deprecate this in favor of the `channel().on().subscribe()` method.

---

## Community

Version 2.0 is the result of the combined work of over 100 contributors to our libraries, and over 450 contributors to our docs and websites.
If you're one of those contributors, thank you.

- [`functions-js`](https://github.com/supabase/functions-js/graphs/contributors) (4)
- [`gotrue-js`](https://github.com/supabase/gotrue-js/graphs/contributors) (47)
- [`postgrest-js`](https://github.com/supabase/postgrest-js/graphs/contributors) (30)
- [`realtime-js`](https://github.com/supabase/realtime-js/graphs/contributors) (16)
- [`storage-js`](https://github.com/supabase/storage-js/graphs/contributors) (17)
- [`supabase-js`](https://github.com/supabase/supabase-js/graphs/contributors) (39)

Special shout outs to: [@vejja](https://github.com/vejja), [@pixtron](https://github.com/pixtron), [@bnjmnt4n](https://github.com/pixtron), and [@karlseguin](https://github.com/karlseguin).

## Migrating to v2

Update today by running:

```bash
npm i @supabase/supabase-js@2
```

[Migration guide](https://supabase.com/docs/reference/javascript/v1/upgrade-guide)

We'll continuing merging security fixes to v1, with maintenance patches for the next three months.

## Announcement video and discussion

<div className="video-container">
  <iframe
    className="w-full"
    src="https://www.youtube-nocookie.com/embed/iqZlPtl_b-I"
    title="YouTube video player"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
</div>

## supabase-js v2 resources

- [v2 Documentation](https://supabase.com/docs/reference/javascript)
- [Migration guide](https://supabase.com/docs/reference/javascript/v1/upgrade-guide)
- [Next.js quickstart guide](/docs/guides/with-nextjs)
- [Examples](https://github.com/supabase/supabase/tree/master/examples)
