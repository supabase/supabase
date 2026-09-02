/// <reference types="vite/types/importMeta.d.ts" />
import { createFileRoute } from '@tanstack/react-router'

import { ConnectedAgents } from '@/registry/default/blocks/headless-app-tanstack/components/connected-agents'

const PRODUCT_NAME = 'Your product'
const MCP_SERVER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mcp-server`

// Nested under _protected, so the layout route redirects signed-out visitors
// before this renders.
// @ts-expect-error The local generated route tree does not include this block route.
export const Route = createFileRoute('/_protected/agents')({
  component: AgentsPage,
})

function AgentsPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <ConnectedAgents
        className="w-full max-w-lg"
        mcpServerUrl={MCP_SERVER_URL}
        productName={PRODUCT_NAME}
      />
    </main>
  )
}
