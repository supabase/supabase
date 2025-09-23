---
id: 'functions-development-tips'
title: 'Development tips'
description: 'Tips for getting started with Edge Functions.'
subtitle: 'Tips for getting started with Edge Functions.'
---

Here are a few recommendations when you first start developing Edge Functions.

### Skipping authorization checks

By default, Edge Functions require a valid JWT in the authorization header. If you want to use Edge Functions without Authorization checks (commonly used for Stripe webhooks), you can pass the `--no-verify-jwt` flag when serving your Edge Functions locally.

```bash
supabase functions serve hello-world --no-verify-jwt
```

Be careful when using this flag, as it will allow anyone to invoke your Edge Function without a valid JWT. The Supabase client libraries automatically handle authorization.

### Using HTTP methods

Edge Functions support `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS`. A Function can be designed to perform different actions based on a request's HTTP method. See the [example on building a RESTful service](https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/restful-tasks) to learn how to handle different HTTP methods in your Function.

<Admonition type="caution" label="HTML not supported">

HTML content is not supported. `GET` requests that return `text/html` will be rewritten to `text/plain`.

</Admonition>

### Naming Edge Functions

We recommend using hyphens to name functions because hyphens are the most URL-friendly of all the naming conventions (snake_case, camelCase, PascalCase).

### Organizing your Edge Functions

We recommend developing "fat functions". This means that you should develop few large functions, rather than many small functions. One common pattern when developing Functions is that you need to share code between two or more Functions. To do this, you can store any shared code in a folder prefixed with an underscore (`_`). We also recommend a separate folder for [Unit Tests](/docs/guides/functions/unit-test) including the name of the function followed by a `-test` suffix.
We recommend this folder structure:

```bash
└── supabase
    ├── functions
    │   ├── import_map.json # A top-level import map to use across functions.
    │   ├── _shared
    │   │   ├── supabaseAdmin.ts # Supabase client with SERVICE_ROLE key.
    │   │   └── supabaseClient.ts # Supabase client with ANON key.
    │   │   └── cors.ts # Reusable CORS headers.
    │   ├── function-one # Use hyphens to name functions.
    │   │   └── index.ts
    │   └── function-two
    │   │   └── index.ts
    │   └── tests
    │       └── function-one-test.ts
    │       └── function-two-test.ts
    ├── migrations
    └── config.toml
```

### Using config.toml

Individual function configuration like [JWT verification](/docs/guides/cli/config#functions.function_name.verify_jwt) and [import map location](/docs/guides/cli/config#functions.function_name.import_map) can be set via the `config.toml` file.

```toml supabase/config.toml
[functions.hello-world]
verify_jwt = false
import_map = './import_map.json'
```

### Not using TypeScript

When you create a new Edge Function, it will use TypeScript by default. However, it is possible to write and deploy Edge Functions using pure JavaScript.

Save your Function as a JavaScript file (e.g. `index.js`) and then update the `supabase/config.toml` as follows:

<Admonition type="note">

`entrypoint` is available only in Supabase CLI version 1.215.0 or higher.

</Admonition>

```toml supabase/config.toml
[functions.hello-world]
# other entries
entrypoint = './functions/hello-world/index.js' # path must be relative to config.toml
```

You can use any `.ts`, `.js`, `.tsx`, `.jsx` or `.mjs` file as the `entrypoint` for a Function.

### Error handling

The `supabase-js` library provides several error types that you can use to handle errors that might occur when invoking Edge Functions:

```js
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js'

const { data, error } = await supabase.functions.invoke('hello', {
  headers: { 'my-custom-header': 'my-custom-header-value' },
  body: { foo: 'bar' },
})

if (error instanceof FunctionsHttpError) {
  const errorMessage = await error.context.json()
  console.log('Function returned an error', errorMessage)
} else if (error instanceof FunctionsRelayError) {
  console.log('Relay error:', error.message)
} else if (error instanceof FunctionsFetchError) {
  console.log('Fetch error:', error.message)
}
```

### Database Functions vs Edge Functions

For data-intensive operations we recommend using [Database Functions](/docs/guides/database/functions), which are executed within your database and can be called remotely using the [REST and GraphQL API](/docs/guides/api).

For use-cases which require low-latency we recommend [Edge Functions](/docs/guides/functions), which are globally-distributed and can be written in TypeScript.
