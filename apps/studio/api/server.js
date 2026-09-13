// STUDIO_FRAMEWORK gates whether this function actually serves the TanStack
// SSR handler. Vercel auto-detects every file under /api as a Function
// regardless of the framework preset (vercel.com/docs/functions), so we
// can't keep this file from being deployed in the Next.js prod build — we
// just make it inert when the env var is unset.
const isTanstack = process.env.STUDIO_FRAMEWORK === 'tanstack'

// Computed path keeps `dist/server/server.js` out of Vercel's function
// bundler's static analysis. In the Next.js prod deploy the `dist/` tree
// doesn't exist, but Vercel still bundles this file because it lives under
// `api/`. With the .join() the bundler treats the import as runtime-only
// and the missing dist/ isn't a build error. In TanStack mode the SSR
// bundle is shipped into the function via the `functions['api/server.js']
// .includeFiles` config in vercel.ts.
const tanstackEntry = ['..', 'dist', 'server', 'server.js'].join('/')

// Initialize server-side Sentry BEFORE the handler module is imported, so its
// instrumentation is in place when route modules evaluate. Gated to TanStack
// (the Next deploy uses instrumentation.ts / sentry.server.config.ts instead).
// Vercel functions can't use a `--import` startup flag, so we import the
// instrument module here at boot. Vercel provides env vars via process.env.
// A Sentry boot failure must never take the API down — mirror scripts/serve.js
// and fall back to the identity wrapper if init or the SDK import throws.
let wrapFetchWithSentry = (fetchHandler) => fetchHandler
if (isTanstack) {
  try {
    await import('../instrument.server.mjs')
  } catch (err) {
    console.warn('[api/server] Sentry server init skipped:', err?.message ?? err)
  }
  ;({ wrapFetchWithSentry } = await import('@sentry/tanstackstart-react').catch(() => ({
    wrapFetchWithSentry: (fetchHandler) => fetchHandler,
  })))
}

const rawHandler = isTanstack
  ? (await import(tanstackEntry)).default
  : { fetch: () => new Response('Not Found', { status: 404 }) }

// Wrap the fetch handler so request-scoped errors (including those swallowed
// into a 500 downstream) are captured with request context.
const handler = isTanstack
  ? { ...rawHandler, fetch: wrapFetchWithSentry(rawHandler.fetch.bind(rawHandler)) }
  : rawHandler

// Vercel's Web API handler convention: export an object with `fetch(request)`.
// TanStack's server build is already shaped that way — default-export it
// verbatim and Vercel hands us a real Web Request.
// eslint-disable-next-line no-restricted-exports
export default handler
