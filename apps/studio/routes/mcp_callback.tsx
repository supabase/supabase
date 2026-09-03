import { createFileRoute } from '@tanstack/react-router'

import McpCallbackPage from '@/pages/mcp_callback'

/** Top-level, i.e. outside `_app` — no dashboard shell wraps this route. */
export const Route = createFileRoute('/mcp_callback')({
  component: McpCallback,
})

function McpCallback() {
  return <McpCallbackPage dehydratedState={undefined} />
}
