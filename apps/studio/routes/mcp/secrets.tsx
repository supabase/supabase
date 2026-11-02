import { createFileRoute } from '@tanstack/react-router'

import McpSecretsPage from '@/pages/mcp/secrets'

export const Route = createFileRoute('/mcp/secrets')({
  component: McpSecrets,
})

function McpSecrets() {
  return <McpSecretsPage dehydratedState={undefined} />
}
