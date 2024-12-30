import { env } from 'bun'
import { Hono } from 'hono'

declare module 'bun' {
  interface Env {
    SUPABASE_REDIRECT_URL: string
    SUPABASE_CLIENT_ID: string
    SUPABASE_CLIENT_SECRET: string
  }
}

const AUTHORIZATION_URL = 'https://api.supabase.com/v1/oauth/authorize'
const TOKEN_URL = 'https://api.supabase.com/v1/oauth/token'

const app = new Hono()

app.get('/', (c) => {
  const params = new URLSearchParams({
    client_id: env.SUPABASE_CLIENT_ID,
    redirect_uri: env.SUPABASE_REDIRECT_URL,
    response_type: 'code',
  })

  return c.html(`
    <!doctype>
    <html>
      <body>
        <a href="${AUTHORIZATION_URL}?${params.toString()}"><button>Login with Supabase</button></a>
      </body>
    </html>
    `)
})

app.get('/callback', async (c) => {
  const tokensResponse = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      Authorization: `Basic ${btoa(`${env.SUPABASE_CLIENT_ID}:${env.SUPABASE_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: c.req.query('code') ?? '',
      redirect_uri: env.SUPABASE_REDIRECT_URL,
    }),
  })

  const tokens = (await tokensResponse.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: 'Bearer'
  }

  return c.text(JSON.stringify(tokens, null, 2))
})

export default app
