import { z } from 'npm:zod@4.4.3'

import type { Toolset } from './registry.ts'

// The smallest possible toolset: one tool, no dependencies. Useful as a
// connectivity check when wiring up a new MCP client, and as the shape to copy
// when writing your own toolset.
export const echoToolset: Toolset = {
  name: 'echo',
  description: 'Connectivity check.',
  register(server) {
    server.registerTool(
      'echo',
      {
        description: 'Echo the provided message back. Use it to confirm the connection works.',
        inputSchema: {
          message: z.string().describe('Text to echo back.'),
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      ({ message }: { message: string }) => ({
        content: [{ type: 'text', text: message }],
      })
    )
  },
}
