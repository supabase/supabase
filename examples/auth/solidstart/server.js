import express from 'express'
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app = express()
const port = 3000

// Middleware to create Supabase client
app.use((req, res, next) => {
  const supabase = createServerClient(
    process.env.PUBLIC_SUPABASE_URL,
    process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(req.headers.cookie ?? '')
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.appendHeader('Set-Cookie', serializeCookieHeader(name, value, options))
          })
        },
      },
    }
  )

  req.supabase = supabase

  // Helper function to safely get session
  req.safeGetSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return { session: null, user: null }
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) {
      // JWT validation has failed
      return { session: null, user: null }
    }

    return { session, user }
  }

  next()
})

// Home route
app.get('/', async (req, res) => {
  const { session, user } = await req.safeGetSession()

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SolidStart + Supabase SSR Example</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 2rem; }
        .container { max-width: 800px; margin: 0 auto; }
        .auth-container { max-width: 400px; margin: 2rem auto; padding: 2rem; border: 1px solid #ddd; border-radius: 8px; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
        .form-group input { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; }
        button:hover { background: #2563eb; }
        .error { color: #dc2626; margin-top: 0.5rem; }
        a { color: #3b82f6; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Express + Supabase SSR Example</h1>
  `

  if (session) {
    html += `
        <div>
          <h2>Server-side Authentication</h2>
          <p>Welcome, ${user?.email}!</p>
          <p>Session expires: ${new Date(session.expires_at * 1000).toLocaleString()}</p>
          <form action="/logout" method="POST" style="display: inline;">
            <button type="submit">Logout</button>
          </form>
        </div>
      </div>
    </body>
    </html>
    `
  } else {
    html += `
        <div>
          <p>You are not authenticated on the server.</p>
          <a href="/login">Login</a>
        </div>
      </div>
    </body>
    </html>
    `
  }

  res.send(html)
})

// Login page
app.get('/login', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Login</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 2rem; }
        .auth-container { max-width: 400px; margin: 2rem auto; padding: 2rem; border: 1px solid #ddd; border-radius: 8px; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
        .form-group input { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; }
        button:hover { background: #2563eb; }
        .error { color: #dc2626; margin-top: 0.5rem; }
        a { color: #3b82f6; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="auth-container">
        <h1>Login</h1>
        <form action="/login" method="POST">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          <button type="submit">Login</button>
        </form>
        <div style="margin-top: 1rem;">
          <a href="/">Back to Home</a>
        </div>
      </div>
    </body>
    </html>
  `
  res.send(html)
})

// Login POST
app.post('/login', express.urlencoded({ extended: true }), async (req, res) => {
  const { email, password } = req.body

  const { error } = await req.supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Login Error</title></head>
      <body>
        <div class="auth-container">
          <h1>Login Failed</h1>
          <p class="error">${error.message}</p>
          <a href="/login">Try Again</a>
        </div>
      </body>
      </html>
    `
    return res.send(html)
  }

  res.redirect('/')
})

// Logout
app.post('/logout', async (req, res) => {
  const { error } = await req.supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error)
  }

  res.redirect('/')
})

// Protected route
app.get('/protected', async (req, res) => {
  const { session, user } = await req.safeGetSession()

  if (!session) {
    res.redirect('/login')
    return
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Protected Route</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 2rem; }
        .container { max-width: 800px; margin: 0 auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Protected Route</h1>
        <p>This page is protected and can only be accessed by authenticated users.</p>
        <div>
          <h2>User Information</h2>
          <p>Email: ${user?.email}</p>
          <p>User ID: ${user?.id}</p>
          <p>Last sign in: ${new Date(user?.last_sign_in_at).toLocaleString()}</p>
        </div>
        <div style="margin-top: 2rem;">
          <a href="/">Back to Home</a>
        </div>
      </div>
    </body>
    </html>
  `
  res.send(html)
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
