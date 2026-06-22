---
title: 'Sending Emails'
description: 'Sending emails from Edge Functions using the Resend API.'
tocVideo: 'Qf7XvL1fjvo'
---

Sending emails from Edge Functions using the [Resend API](https://resend.com/).

### Prerequisites

To get the most out of this guide, you’ll need to:

- [Create an API key](https://resend.com/api-keys)
- [Verify your domain](https://resend.com/domains)

Make sure you have the latest version of the [Supabase CLI](/docs/guides/cli#installation) installed.

### 1. Create Supabase function

Create a new function locally:

```bash
supabase functions new resend
```

Store the `RESEND_API_KEY` in your `.env` file.

### 2. Edit the handler function

Paste the following code into the `index.ts` file:

```tsx
import { withSupabase } from 'npm:@supabase/server@^1'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const handler = async (_request: Request): Promise<Response> => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: 'delivered@resend.dev',
      subject: 'hello world',
      html: '<strong>it works!</strong>',
    }),
  })

  const data = await res.json()

  return Response.json(data)
}

export default { fetch: withSupabase({ auth: ['user', 'secret'] }, handler) }
```

### 3. Deploy and send email

Run function locally:

```bash
supabase start
supabase functions serve --no-verify-jwt --env-file .env
```

The function accepts a signed-in user's JWT or a secret key, so it can be triggered from your app (via `supabase.functions.invoke`) or from a database function. Test it locally with a secret key:

```bash
curl -i --request POST 'http://localhost:54321/functions/v1/resend' \
  --header 'apikey: <SUPABASE_SECRET_KEY>'
```

Deploy function to Supabase:

```bash
supabase functions deploy resend --no-verify-jwt
```

<Admonition type="caution">

When you deploy to Supabase, make sure that your `RESEND_API_KEY` is set in [Edge Function Secrets Management](/dashboard/project/_/functions/secrets)

</Admonition>

### 4. Try it yourself

Find the complete example on [GitHub](https://github.com/resendlabs/resend-supabase-edge-functions-example).
