import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import cliReleaseVersion from '@/pages/api/cli-release-version'

const handler = toWebHandler(cliReleaseVersion)

export const Route = createFileRoute('/api/cli-release-version')({
  server: { handlers: { GET: handler } },
})
