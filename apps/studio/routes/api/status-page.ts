import { createFileRoute } from '@tanstack/react-router'

import { GET, HEAD, OPTIONS } from '@/app/api/status-page/route'

export const Route = createFileRoute('/api/status-page')({
  server: {
    handlers: {
      GET: () => GET(),
      HEAD: () => HEAD(),
      OPTIONS: () => OPTIONS(),
    },
  },
})
