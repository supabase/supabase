import { jsonResult } from './result.ts'
import type { Toolset } from './types.ts'

// A user-scoped toolset that needs no database access: it answers straight from
// the verified token claims, which demonstrates that every tool runs as the
// signed-in user.
export const whoamiToolset: Toolset = {
  name: 'whoami',
  register(server, { claims, clientId }) {
    server.registerTool(
      'whoami',
      {
        description: "Return the signed-in user's identity and OAuth client id.",
        inputSchema: {},
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      () =>
        jsonResult({
          sub: claims.sub ?? null,
          email: claims.email ?? null,
          role: claims.role ?? null,
          client_id: clientId,
        })
    )
  },
}
