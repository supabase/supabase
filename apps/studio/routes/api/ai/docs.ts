import { createFileRoute } from '@tanstack/react-router'
import type { NextRequest } from 'next/server'

// docs.ts is already Web-native (Next edge runtime): takes `NextRequest`,
// returns `Response`, and streams SSE back from OpenAI. Direct re-export —
// no shim buffering needed.
import docsHandler from '@/pages/api/ai/docs'

export const Route = createFileRoute('/api/ai/docs')({
  server: {
    handlers: {
      POST: ({ request }) => docsHandler(request as NextRequest),
    },
  },
})
