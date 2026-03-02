---
id: 'functions-cors'
title: 'CORS (Cross-Origin Resource Sharing) support for Invoking from the browser'
description: 'Add CORS headers to invoke Edge Functions from the browser.'
---

To invoke edge functions from the browser, you need to handle [CORS Preflight](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request) requests.

See the [example on GitHub](https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/browser-with-cors/index.ts).

### Recommended setup

<Admonition type="tip">

**For `@supabase/supabase-js` v2.95.0 and later:** Import CORS headers directly from the SDK to ensure they stay synchronized with any new headers added to the client libraries.

</Admonition>

Import `corsHeaders` from `@supabase/supabase-js/cors` to automatically get all required headers:

```ts index.ts
import { corsHeaders } from '@supabase/supabase-js/cors'

console.log(`Function "browser-with-cors" up and running!`)

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name } = await req.json()
    const data = {
      message: `Hello ${name}!`,
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

This approach ensures that when new headers are added to the Supabase SDK, your Edge Functions automatically include them, preventing CORS errors.

#### For versions before 2.95.0

If you're using `@supabase/supabase-js` before v2.95.0, you'll need to hardcode the CORS headers. Add a `cors.ts` file within a [`_shared` folder](/docs/guides/functions/quickstart#organizing-your-edge-functions):

```ts _shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

Then import it in your function:

```ts index.ts
import { corsHeaders } from '../_shared/cors.ts'

// ... rest of your function code
```
