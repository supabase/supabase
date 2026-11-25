import { createFileRoute } from '@tanstack/react-router'

import type { DeploymentModeResponse } from '@/data/config/deployment-mode-query'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { IS_CLI } from '@/lib/constants'

export const Route = createFileRoute('/api/platform/deployment-mode')({
  server: {
    handlers: createApiHandlers({
      GET: () =>
        Response.json(
          {
            is_cli_mode: IS_CLI,
          } satisfies DeploymentModeResponse,
          { status: 200 }
        ),
    }),
  },
})
