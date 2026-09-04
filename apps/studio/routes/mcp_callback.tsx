import { createFileRoute } from '@tanstack/react-router'

import McpCallbackPage from '@/pages/mcp_callback'

export const Route = createFileRoute('/mcp_callback')({
  component: McpCallback,
})

function McpCallback() {
  return <McpCallbackPage dehydratedState={undefined} />
}
