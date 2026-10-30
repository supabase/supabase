import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import generateAttachmentUrl from '@/pages/api/generate-attachment-url'

const handler = toWebHandler(generateAttachmentUrl)

export const Route = createFileRoute('/api/generate-attachment-url')({
  server: { handlers: { POST: handler } },
})
