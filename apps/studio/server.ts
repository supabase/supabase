// wrapFetchWithSentry only adds a span, trace meta tags, and a flush. errors
// are captured in start.ts, because only the sentry middleware sees handler throws.
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
