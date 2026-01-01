# SolidStart + Supabase Auth Example

This example demonstrates how to implement server-side authentication with Supabase in a SolidStart application.

## Features

- ✅ Server-side session management with middleware
- ✅ Protected routes with server-side authentication checks
- ✅ Login/logout functionality
- ✅ Automatic session refresh
- ✅ Type-safe Supabase client utilities

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values at [https://supabase.com/dashboard/project/_/settings/api](https://supabase.com/dashboard/project/_/settings/api)

3. Run the development server:

```bash
npm run dev
```

## How It Works

### Middleware

The middleware ([src/middleware.ts](src/middleware.ts)) runs on every request and refreshes the session if needed. This ensures that your auth tokens are always up to date.

### Server Client

The server client ([src/lib/supabase/server.ts](src/lib/supabase/server.ts)) is used in server-side code (loaders, actions) to access Supabase with the user's session.

### Browser Client

The browser client ([src/lib/supabase/client.ts](src/lib/supabase/client.ts)) is used in client-side code for features like realtime subscriptions.

### Protected Routes

Protected routes use a cache function with `"use server"` to check authentication on the server. See [src/routes/protected.tsx](src/routes/protected.tsx) for an example.

## Key Concepts

### Why use `getUser()` instead of `getSession()`?

`getUser()` validates the JWT signature against Supabase's public keys on every call, making it secure for authentication checks. `getSession()` only reads from the cookie, which can be spoofed.

### Why separate middleware and `"use server"`?

In SolidStart:
- **Middleware** runs before route handlers and handles session refresh
- **`"use server"`** marks functions as server-only RPC endpoints for data fetching and mutations

Using them together can cause bundling issues where server-only code leaks into the client bundle.

## Routes

- `/` - Home page (public, shows different content for authenticated users)
- `/login` - Login page
- `/logout` - Logout endpoint (redirects to home)
- `/protected` - Protected page (requires authentication)

## Learn More

- [SolidStart Documentation](https://docs.solidjs.com/solid-start)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side-rendering)
