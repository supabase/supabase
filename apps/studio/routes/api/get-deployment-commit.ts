import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import getDeploymentCommit from '@/pages/api/get-deployment-commit'

const handler = toWebHandler(getDeploymentCommit)

export const Route = createFileRoute('/api/get-deployment-commit')({
  server: { handlers: { GET: handler } },
})
