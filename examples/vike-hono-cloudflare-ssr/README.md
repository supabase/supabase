# Vike + Hono + Supabase SSR Fix

This example demonstrates how to properly handle Supabase SSR cookies in a Vike + Hono + Cloudflare Workers setup.

## Problem

When using `@supabase/ssr` with `createServerClient` in a Vike + Hono + Cloudflare app, cookies set via `cookies.setAll` in the Supabase middleware are not attached to the response automatically. This happens because:

1. Vike intercepts SSR requests and generates its own response
2. Standard Hono middleware works for API routes but not for SSR pages  
3. `cookies.setAll` sets cookies via Hono's `setCookie`, but these never reach the browser for SSR pages

## Solution

This solution provides:

1. **Enhanced Supabase Middleware**: Collects cookies in headers that can be accessed later
2. **Response Handler**: Merges Supabase cookies with Vike's SSR response
3. **Proper SSR Integration**: Handles cookies in both server-side rendering and client hydration

## Key Files

- `middleware/supabase.ts` - Enhanced Supabase middleware that collects cookies
- `server.ts` - Main Hono app with Vike integration and response handler
- `utils/supabase-server.ts` - Server-side Supabase client for Vike hooks
- `utils/supabase-browser.ts` - Browser-side Supabase client
- `pages/+onBeforeRender.ts` - SSR hook that fetches user session
- `pages/+onRenderHtml.ts` - Renders HTML and applies cookies

## Usage

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `wrangler.toml` or use secrets:
```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
```

3. Run development server:
```bash
npm run dev
```

## How It Works

1. **API Routes**: Work normally with Hono middleware - cookies are set directly
2. **SSR Pages**: 
   - Supabase middleware collects cookies in headers
   - Vike processes the SSR request
   - Response handler merges collected cookies with Vike's response
   - Cookies reach the browser and enable proper session management

This ensures that Supabase session cookies work correctly for both SSR and client-side hydration in Vike + Hono + Cloudflare Workers applications.
