<a href="https://supabase.com/docs/guides/auth/server-side/creating-a-client">
  <img alt="Supabase SSR Auth Example - Server-side authentication with Supabase" src="https://supabase.com/docs/img/supabase-logo-wordmark--dark.svg">
  <h1 align="center">Express + Supabase SSR Auth Example</h1>
</a>

<p align="center">
  Server-side rendering authentication with Supabase
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#run-locally"><strong>Run Locally</strong></a> ·
  <a href="#feedback-and-issues"><strong>Feedback and issues</strong></a> ·
  <a href="#more-supabase-examples"><strong>More Examples</strong></a>
</p>
<br/>

## Features

- **Server-side authentication** - JWT tokens validated on every request
- **Cookie-based sessions** - Sessions persist across requests using HTTP cookies
- **Route protection** - Unauthenticated users automatically redirected
- **Safe session management** - Server-side validation prevents client-side spoofing
- **Express.js implementation** - Demonstrates SSR concepts applicable to any framework
- **Complete authentication flow** - Login, logout, and protected routes

## Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**

   Create a `.env` file in the project root with your Supabase credentials:

   ```bash
   PUBLIC_SUPABASE_URL=your_supabase_project_url
   PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   ```

   Both `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` can be found in [your Supabase project's API settings](https://app.supabase.com/project/_/settings/api)

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The example should now be running on [localhost:3000](http://localhost:3000/).

## Project Structure

```
├── server.js              # Express server with Supabase SSR implementation
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variables template
├── README.md              # This file
└── src/                   # Reference implementations (SolidStart concepts)
    ├── middleware.ts      # Original SolidStart middleware approach
    ├── routes/            # Route handling concepts
    └── root.tsx           # Component structure reference
```

## Key Concepts Demonstrated

### Server-Side Session Validation

The Express server validates JWT tokens on every request:

```javascript
req.safeGetSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { session: null, user: null }
  }

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    // JWT validation failed
    return { session: null, user: null }
  }

  return { session, user }
}
```

### Cookie-Based Authentication

Sessions are managed through HTTP cookies, providing:
- Automatic session persistence
- Server-side validation
- CSRF protection
- Secure session handling

### Route-Level Protection

Protected routes validate authentication before rendering:

```javascript
app.get('/protected', async (req, res) => {
  const { session, user } = await req.safeGetSession()

  if (!session) {
    res.redirect('/login')
    return
  }

  // Render protected content for authenticated users
})
```

## Testing the Example

1. **Visit the home page** - Shows current authentication status
2. **Try the login page** - Use test credentials to authenticate
3. **Access protected routes** - Should redirect to login if not authenticated
4. **Test logout** - Clears session and redirects appropriately

## Feedback and issues

Please file feedback and issues over on the [Supabase GitHub org](https://github.com/supabase/supabase/issues/new/choose).

## More Supabase examples

- [Next.js Auth Example](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)
- [SvelteKit Auth Example](https://github.com/supabase/supabase/tree/master/examples/auth/sveltekit)
- [Hono Auth Example](https://github.com/supabase/supabase/tree/master/examples/auth/hono)
- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
