import { createFileRoute } from '@tanstack/react-router'

import { McpSecrets } from '@/components/interfaces/MCP/Secrets/McpSecrets'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'

export const Route = createFileRoute('/mcp/secrets')({
  component: McpSecretsRoute,
})

function McpSecretsRoute() {
  return <McpSecretsPageWithAuth />
}

const PAGE_TITLE = buildStudioPageTitle({ section: 'Store an API key', brand: 'Supabase' })

function McpSecretsPage() {
  return (
    <>
      <title>{PAGE_TITLE}</title>
      <McpSecrets />
    </>
  )
}

const McpSecretsPageWithAuth = withAuth(McpSecretsPage)
