---
title: 'Custom Auth Emails with React Email and Resend'
description: 'Use the send email hook to send custom auth emails with React Email and Resend in Supabase Edge Functions.'
tocVideo: 'tlA7BomSCgU'
---

Use the [send email hook](/docs/guides/auth/auth-hooks/send-email-hook?queryGroups=language&language=http) to send custom auth emails with [React Email](https://react.email/) and [Resend](https://resend.com/) in Supabase Edge Functions.

<Admonition type="note">

Prefer to jump straight to the code? [Check out the example on GitHub](https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/auth-hook-react-email-resend).

</Admonition>

### Prerequisites

To get the most out of this guide, you’ll need to:

- [Create a Resend API key](https://resend.com/api-keys)
- [Verify your domain](https://resend.com/domains)

Make sure you have the latest version of the [Supabase CLI](/docs/guides/cli#installation) installed.

### 1. Create Supabase function

Create a new function locally:

```bash
supabase functions new send-email
```

### 2. Edit the handler function

Paste the following code into the `index.ts` file:

```tsx supabase/functions/send-email/index.ts
import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { MagicLinkEmail } from './_templates/magic-link.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = (Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string).replace('v1,whsec_', '')

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(hookSecret)
  try {
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
        token_new: string
        token_hash_new: string
      }
    }

    const html = await renderAsync(
      React.createElement(MagicLinkEmail, {
        supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
        token,
        token_hash,
        redirect_to,
        email_action_type,
      })
    )

    const { error } = await resend.emails.send({
      from: 'welcome <onboarding@resend.dev>',
      to: [user.email],
      subject: 'Supa Custom MagicLink!',
      html,
    })
    if (error) {
      throw error
    }
  } catch (error) {
    console.log(error)
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code,
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const responseHeaders = new Headers()
  responseHeaders.set('Content-Type', 'application/json')
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: responseHeaders,
  })
})
```

### 3. Create React Email templates

Create a new folder `_templates` and create a new file `magic-link.tsx` with the following code:

```tsx supabase/functions/send-email/_templates/magic-link.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface MagicLinkEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
}

export const MagicLinkEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>Log in with this magic link</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Login</Heading>
        <Link
          href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
          target="_blank"
          style={{
            ...link,
            display: 'block',
            marginBottom: '16px',
          }}
        >
          Click here to log in with this magic link
        </Link>
        <Text style={{ ...text, marginBottom: '14px' }}>
          Or, copy and paste this temporary login code:
        </Text>
        <code style={code}>{token}</code>
        <Text
          style={{
            ...text,
            color: '#ababab',
            marginTop: '14px',
            marginBottom: '16px',
          }}
        >
          If you didn&apos;t try to login, you can safely ignore this email.
        </Text>
        <Text style={footer}>
          <Link
            href="https://demo.vercel.store/"
            target="_blank"
            style={{ ...link, color: '#898989' }}
          >
            ACME Corp
          </Link>
          , the famouse demo corp.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = {
  backgroundColor: '#ffffff',
}

const container = {
  paddingLeft: '12px',
  paddingRight: '12px',
  margin: '0 auto',
}

const h1 = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const link = {
  color: '#2754C5',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  textDecoration: 'underline',
}

const text = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  margin: '24px 0',
}

const footer = {
  color: '#898989',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '12px',
  marginBottom: '24px',
}

const code = {
  display: 'inline-block',
  padding: '16px 4.5%',
  width: '90.5%',
  backgroundColor: '#f4f4f4',
  borderRadius: '5px',
  border: '1px solid #eee',
  color: '#333',
}
```

<Admonition type="note">

You can find a selection of React Email templates in the [React Email Examples](https://react.email/examples).

</Admonition>

### 4. Deploy the Function

Deploy function to Supabase:

```bash
supabase functions deploy send-email --no-verify-jwt
```

Note down the function URL, you will need it in the next step!

### 5. Configure the Send Email Hook

- Go to the [Auth Hooks](/dashboard/project/_/auth/hooks) section of the Supabase dashboard and create a new "Send Email hook".
- Select HTTPS as the hook type.
- Paste the function URL in the "URL" field.
- Click "Generate Secret" to generate your webhook secret and note it down.
- Click "Create" to save the hook configuration.

Store these secrets in your `.env` file.

```bash supabase/functions/.env
RESEND_API_KEY=your_resend_api_key
SEND_EMAIL_HOOK_SECRET="v1,whsec_<base64_secret>"
```

<Admonition type="note">

You can generate the secret in the [Auth Hooks](/dashboard/project/_/auth/hooks) section of the Supabase dashboard.

</Admonition>

Set the secrets from the `.env` file:

```bash
supabase secrets set --env-file supabase/functions/.env
```

Now your Supabase Edge Function will be triggered anytime an Auth Email needs to be sent to the user!

## More resources

- [Send Email Hooks](/docs/guides/auth/auth-hooks/send-email-hook)
- [Auth Hooks](/docs/guides/auth/auth-hooks)
