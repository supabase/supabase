import { createFileRoute } from '@tanstack/react-router'

// App Router route (apps/studio/app/api/incident-status/route.ts) — already
// Web-native, uses NextResponse which extends `Response`. Direct re-export of
// each HTTP method; no shim needed.
import { GET, HEAD, OPTIONS } from '@/app/api/incident-status/route'

export const Route = createFileRoute('/api/incident-status')({
  server: {
    handlers: {
      GET: () => GET(),
      HEAD: () => HEAD(),
      OPTIONS: () => OPTIONS(),
    },
  },
})
