---
id: 'functions-status-codes'
title: 'Status codes'
description: 'Edge Functions can return following status codes.'
subtitle: 'Understand HTTP status codes returned by Edge Functions to properly debug issues and handle responses.'
---

{/* supa-mdx-lint-disable Rule001HeadingCase */}

## Success Responses

### 2XX Success

Your Edge Function executed successfully and returned a valid response. This includes any status code in the 200-299 range that your function explicitly returns.

### 3XX Redirect

Your Edge Function used the `Response.redirect()` API to redirect the client to a different URL. This is a normal response when implementing authentication flows or URL forwarding.

---

## Client Errors

These errors indicate issues with the request itself, which typically require changing how the function is called.

### 401 Unauthorized

**Cause:** The Edge Function has JWT verification enabled, but the request was made with an invalid or missing JWT token.

**Solution:**

- Ensure you're passing a valid JWT token in the `Authorization` header
- Check that your token hasn't expired
- For webhooks or public endpoints, consider disabling JWT verification

### 404 Not Found

**Cause:** The requested Edge Function doesn't exist or the URL path is incorrect.

**Solution:**

- Verify the function name and project reference in your request URL
- Check that the function has been deployed successfully

### 405 Method Not Allowed

**Cause:** You're using an unsupported HTTP method. Edge Functions only support: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS`.

**Solution:** Update your request to use a supported HTTP method.

---

## Server Errors

These errors indicate issues with the function execution or underlying platform.

### 500 Internal Server Error

**Cause:** Your Edge Function threw an uncaught exception (`WORKER_ERROR`).

**Common causes:**

- Unhandled JavaScript errors in your function code
- Missing error handling for async operations
- Invalid JSON parsing

**Solution:** Check your Edge Function logs to identify the specific error and add proper error handling to your code.

```tsx
// ✅ Good error handling
try {
  const result = await someAsyncOperation()
  return new Response(JSON.stringify(result))
} catch (error) {
  console.error('Function error:', error)
  return new Response('Internal error', { status: 500 })
}
```

You can see the output in the [Edge Function Logs](/docs/guides/functions/logging).

### 503 Service Unavailable

**Cause:** Your Edge Function failed to start (`BOOT_ERROR`).

**Common causes:**

- Syntax errors preventing the function from loading
- Import errors or missing dependencies
- Invalid function configuration

**Solution:** Check your Edge Function logs and verify your function code can be executed locally with `supabase functions serve`.

### 504 Gateway Timeout

**Cause:** Your Edge Function didn't respond within the [request timeout limit](/docs/guides/functions/limits).

**Common causes:**

- Long-running database queries
- Slow external API calls
- Infinite loops or blocking operations

**Solution:**

- Optimize slow operations
- Add timeout handling to external requests
- Consider breaking large operations into smaller chunks

### 546 Resource Limit (Custom Error Code)

**Cause:** Your Edge Function execution was stopped due to exceeding resource limits (`WORKER_LIMIT`). Edge Function logs should provide which [resource limit](/docs/guides/functions/limits) was exceeded.

**Common causes:**

- Memory usage exceeded available limits
- CPU time exceeded execution quotas
- Too many concurrent operations

**Solution:** Check your Edge Function logs to see which resource limit was exceeded, then optimize your function accordingly.
