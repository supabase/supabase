import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import enabledFeaturesOverrides from '@/pages/api/enabled-features-overrides'

const handler = toWebHandler(enabledFeaturesOverrides)

export const Route = createFileRoute('/api/enabled-features-overrides')({
  server: { handlers: { GET: handler } },
})
