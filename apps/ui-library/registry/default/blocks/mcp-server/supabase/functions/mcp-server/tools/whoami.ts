import type { Toolset } from './registry.ts'
import { jsonResult } from './result.ts'

// A user-scoped toolset that needs no database access: it answers straight from
// the verified token claims, which demonstrates that every tool runs as the
// signed-in user.
export const whoamiToolset: Toolset = {
  name: 'whoami',
  description: "The signed-in user's identity.",
  register(server, { principal }) {
    server.registerTool(
      'whoami',
      {
        description: "Return the signed-in user's id, email, and role.",
        inputSchema: {},
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      () =>
        jsonResult({
          sub: principal.claims.sub ?? null,
          email: principal.claims.email ?? null,
          role: principal.claims.role ?? null,
        })
    )
  },
}
