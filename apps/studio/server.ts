// TanStack Start server entry (resolved from `srcDirectory` by tanstackStart()).
// Nitro bundles it into the server for every target: the Vercel function and
// the self-hosted node server alike.
//
// Sentry's server init must run before the route tree evaluates, so the
// instrument module is the first import. `wrapFetchWithSentry` then captures
// request-scoped errors, including ones downstream code swallows into a 500.
import './instrument.server.mjs'

import { wrapFetchWithSentry } from '@sentry/tanstackstart-react'
import handler, { createServerEntry, type ServerEntry } from '@tanstack/react-start/server-entry'

const requestHandler: ServerEntry = wrapFetchWithSentry({
  fetch(request: Request) {
    return handler.fetch(request)
  },
})

// eslint-disable-next-line no-restricted-exports
export default createServerEntry(requestHandler)
