import { env } from 'bun'
import { Hono } from 'hono'

declare module 'bun' {
  interface Env {
    SUPABASE_REDIRECT_URL: string
    SUPABASE_CLIENT_ID: string
    SUPABASE_CLIENT_SECRET: string
  }
}

const AUTHORIZATION_URL = 'http://localhost:8080/v1/oauth/authorize'
const TOKEN_URL = 'http://localhost:8080/v1/oauth/token'

const app = new Hono()

app.get('/', (c) => {
  const params = new URLSearchParams({
    client_id: env.SUPABASE_CLIENT_ID,
    redirect_uri: env.SUPABASE_REDIRECT_URL,
    response_type: 'code',
  })

  const baseUrl = `${AUTHORIZATION_URL}?${params.toString()}`

  return c.html(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Login with Supabase</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f4f4f5;
            color: #171717;
            font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
          }
          form {
            width: 100%;
            max-width: 360px;
            padding: 32px;
            background: #fff;
            border: 1px solid #e4e4e7;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          }
          h1 { margin: 0 0 4px; font-size: 20px; }
          .hint { margin: 0 0 24px; font-size: 14px; color: #71717a; }
          label { display: block; margin-bottom: 16px; font-size: 14px; font-weight: 500; }
          input {
            display: block;
            width: 100%;
            margin-top: 6px;
            padding: 8px 12px;
            font: inherit;
            border: 1px solid #d4d4d8;
            border-radius: 6px;
          }
          input:focus { outline: 2px solid #3ecf8e; outline-offset: 0; border-color: #3ecf8e; }
          button {
            width: 100%;
            margin-top: 8px;
            padding: 10px 16px;
            font: inherit;
            font-weight: 600;
            color: #fff;
            background: #3ecf8e;
            border: 0;
            border-radius: 6px;
            cursor: pointer;
          }
          button:hover { background: #34b27b; }
        </style>
      </head>
      <body>
        <form id="login-form">
          <h1>Login with Supabase</h1>
          <p class="hint">Organization and project are optional.</p>
          <label>Organization <input type="text" name="organization_slug" /></label>
          <label>Project <input type="text" name="project_ref" /></label>
          <button type="submit">Login with Supabase</button>
        </form>
        <script>
          const baseUrl = ${JSON.stringify(baseUrl).replace(/</g, '\\u003c')}
          document.getElementById('login-form').addEventListener('submit', (event) => {
            event.preventDefault()
            const url = new URL(baseUrl)
            const form = new FormData(event.target)
            for (const name of ['organization_slug', 'project_ref']) {
              const value = form.get(name)
              if (value) url.searchParams.set(name, value)
            }
            window.location.href = url.toString()
          })
        </script>
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
