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

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

Deno.serve(handler)
```

### 3. Deploy and send email

Run function locally:

```bash
supabase start
supabase functions serve --no-verify-jwt --env-file .env
```

Test it: http://localhost:54321/functions/v1/resend

Deploy function to Supabase:

```bash
supabase functions deploy resend --no-verify-jwt
```

<Admonition type="caution">

When you deploy to Supabase, make sure that your `RESEND_API_KEY` is set in [Edge Function Secrets Management](/dashboard/project/_/functions/secrets)

</Admonition>

Open the endpoint URL to send an email:

### 4. Try it yourself

Find the complete example on [GitHub](https://github.com/resendlabs/resend-supabase-edge-functions-example).
