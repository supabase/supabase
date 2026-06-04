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

const handler = isTanstack
  ? (await import(tanstackEntry)).default
  : { fetch: () => new Response('Not Found', { status: 404 }) }

// Vercel's Web API handler convention: export an object with `fetch(request)`.
// TanStack's server build is already shaped that way — default-export it
// verbatim and Vercel hands us a real Web Request.
// eslint-disable-next-line no-restricted-exports
export default handler
