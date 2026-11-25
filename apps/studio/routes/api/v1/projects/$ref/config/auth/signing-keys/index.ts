import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { getLegacySigningKey } from '@/lib/api/self-hosted/signing-keys'

export const Route = createFileRoute('/api/v1/projects/$ref/config/auth/signing-keys/')({
  server: {
    handlers: createApiHandlers({
      GET: () => Response.json({ keys: [getLegacySigningKey()] }, { status: 200 }),
    }),
  },
})
