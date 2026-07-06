import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import design from '@/pages/api/ai/onboarding/design'

const handler = toWebHandler(design)

export const Route = createFileRoute('/api/ai/onboarding/design')({
  server: { handlers: { POST: handler } },
})
