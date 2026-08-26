/// <reference types="vite/types/importMeta.d.ts" />
import { createFileRoute } from '@tanstack/react-router'

import { ConnectedAgents } from '@/registry/default/blocks/headless-app-tanstack/components/connected-agents'

const PRODUCT_NAME = 'Your product'
const MCP_SERVER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mcp-server`

// Nested under _protected, so the layout route redirects signed-out visitors
// and hands the signed-in user down through its context.
// @ts-expect-error The local generated route tree does not include this block route.
export const Route = createFileRoute('/_protected/agents')({
  component: AgentsPage,
  loader: ({ context }) => ({ user: context.user! }),
})

function AgentsPage() {
  const { user } = Route.useLoaderData()

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-10 p-6 md:p-10">
      <p className="truncate text-sm text-muted-foreground">Signed in as {user.email}</p>
      <ConnectedAgents mcpServerUrl={MCP_SERVER_URL} productName={PRODUCT_NAME} />
    </main>
  )
}
