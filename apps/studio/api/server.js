// @ts-ignore - built at `vite build` time, not present in source
import handler from '../dist/server/server.js'

// Vercel's Web API handler convention: export an object with `fetch(request)`.
// TanStack's server build is already shaped that way — default-export it
// verbatim and Vercel hands us a real Web Request.
// eslint-disable-next-line no-restricted-exports
export default handler
