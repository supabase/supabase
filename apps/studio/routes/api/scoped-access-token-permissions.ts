import { createFileRoute } from '@tanstack/react-router'

// App Router route (apps/studio/app/api/scoped-access-token/route.ts) — already
// Web-native, uses NextResponse which extends `Response`. Direct re-export of
// each HTTP method; no shim needed.
import { GET, HEAD, OPTIONS } from '@/app/api/scoped-access-token-permissions/route'

export const Route = createFileRoute('/api/scoped-access-token-permissions')({
  server: {
    handlers: {
      GET: () => GET(),
      HEAD: () => HEAD(),
      OPTIONS: () => OPTIONS(),
    },
  },
})
