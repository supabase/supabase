---
id: 'functions-cors'
title: 'CORS (Cross-Origin Resource Sharing) support for Invoking from the browser'
description: 'Add CORS headers to invoke Edge Functions from the browser.'
---

To invoke edge functions from the browser, you need to handle [CORS Preflight](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request) requests.

## Automatic CORS handling

The [`withSupabase`](/docs/guides/functions/auth) wrapper handles CORS and preflight (`OPTIONS`) requests for you, so you don't add headers manually:

```ts index.ts
import { withSupabase } from 'npm:@supabase/server@^1'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const { name } = await req.json()
    return Response.json({ message: `Hello ${name}!` })
  }),
}
```

## Manual CORS handling

If your function doesn't use `withSupabase`, add the headers yourself. See the [example on GitHub](https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/browser-with-cors/index.ts).

<Admonition type="tip">

**For `@supabase/supabase-js` v2.95.0 and later:** Import CORS headers directly from the SDK to ensure they stay synchronized with any new headers added to the client libraries.

</Admonition>

Import `corsHeaders` from `npm:@supabase/supabase-js@^2/cors` to automatically get all required headers:

```ts index.ts
import { corsHeaders } from 'npm:@supabase/supabase-js@^2/cors'

console.log(`Function "browser-with-cors" up and running!`)

export default {
  fetch: async (req) => {
    // Handle the CORS preflight request.
    if (req.method === 'OPTIONS') {
      return Response.json({ ok: true }, { headers: corsHeaders })
    }

    try {
      const { name } = await req.json()
      return Response.json({ message: `Hello ${name}!` }, { headers: corsHeaders })
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400, headers: corsHeaders })
    }
  },
}
```

This approach ensures that when new headers are added to the Supabase SDK, your Edge Functions automatically include them, preventing CORS errors.

### For versions before 2.95.0

If you're using `@supabase/supabase-js` before v2.95.0, you'll need to hardcode the CORS headers. Add a `cors.ts` file within a [`_shared` folder](/docs/guides/functions/development-environment#recommended-project-structure):

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
