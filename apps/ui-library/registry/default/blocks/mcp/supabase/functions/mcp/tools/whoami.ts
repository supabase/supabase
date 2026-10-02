import type { McpServer } from 'npm:@modelcontextprotocol/server@2.0.0'

import { jsonResult } from './result.ts'
import type { ToolContext } from './types.ts'

// Answers from verified claims, demonstrating that every tool runs as the
// signed-in user. client_id is present for OAuth tokens and null for ordinary
// product sessions.
export function registerWhoamiTool(
  server: McpServer,
  { userClaims, jwtClaims }: ToolContext
): void {
  const clientId =
    typeof jwtClaims?.client_id === 'string' && jwtClaims.client_id ? jwtClaims.client_id : null

  server.registerTool(
    'whoami',
    {
      description: "Return the signed-in user's identity and OAuth client id, when present.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    () =>
      jsonResult({
        id: userClaims.id,
        email: userClaims.email ?? null,
        role: userClaims.role ?? null,
        client_id: clientId,
      })
  )
}
