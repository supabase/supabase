// TanStack Start server entry; Nitro bundles it into the server for every
// target. Sentry's init must run before the route tree evaluates, so the
// instrument module is imported first; `wrapFetchWithSentry` then captures
// request-scoped errors, including ones swallowed into a 500 downstream.
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
