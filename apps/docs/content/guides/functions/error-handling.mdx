---
id: error-handling
title: Error Handling
description: Learn how to handle errors in your Edge Functions.
subtitle: Implement proper error responses and client-side handling to create reliable applications.
---

## Error handling

Implementing the right error responses and client-side handling helps with debugging and makes your functions much easier to maintain in production.

Within your Edge Functions, return proper HTTP status codes and error messages:

```tsx
Deno.serve(async (req) => {
  try {
    // Your function logic here
    const result = await processRequest(req)
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
```

**Best practices for function errors:**

- Use the right HTTP status code for each situation. Return `400` for bad user input, 404 when something doesn't exist, 500 for server errors, etc. This helps with debugging and lets client apps handle different error types appropriately.
- Include helpful error messages in the response body
- Log errors to the console for debugging (visible in the Logs tab)

---

## Client-side error handling

Within your client-side code, an Edge Function can throw three types of errors:

- **`FunctionsHttpError`**: Your function executed but returned an error (4xx/5xx status)
- **`FunctionsRelayError`**: Network issue between client and Supabase
- **`FunctionsFetchError`**: Function couldn't be reached at all

```jsx
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

Make sure to handle the errors properly. Functions that fail silently are hard to debug, functions with clear error messages get fixed fast.

---

## Error monitoring

You can see the production error logs in the Logs tab of your Supabase Dashboard.

![Function invocations.](/docs/img/guides/functions/function-logs.png)

For more information on Logging, check out [this guide](/docs/guides/functions/logging).
