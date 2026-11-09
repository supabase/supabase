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
      <body>
        <form id="login-form">
          <p>
            <label>Organization <input type="text" name="organization_slug" /></label>
          </p>
          <p>
            <label>Project <input type="text" name="project_ref" /></label>
          </p>
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
