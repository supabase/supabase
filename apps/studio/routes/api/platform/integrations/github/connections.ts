import { createFileRoute } from '@tanstack/react-router'
import { paths } from 'api-types'

import { createApiHandlers } from '@/lib/api/apiWrapper'

type ResponseData =
  paths['/platform/integrations/github/connections']['get']['responses']['200']['content']['application/json']

export const Route = createFileRoute('/api/platform/integrations/github/connections')({
  server: {
    handlers: createApiHandlers({
      GET: () => Response.json({ connections: [] } satisfies ResponseData, { status: 200 }),
    }),
  },
})
