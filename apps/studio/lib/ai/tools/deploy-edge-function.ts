import { z } from 'zod'

import type { ToolContract } from './types'

const inputSchema = z.object({
  name: z.string().describe('The URL-friendly name/slug of the Edge Function.'),
  code: z.string().describe('The TypeScript code for the Edge Function.'),
})

export const contract = {
  name: 'deploy_edge_function',
  description:
    'Asks the user to deploy a Supabase Edge Function from provided code. Requires user approval before deploying.',
  inputSchema,
  outputSchema: z.object({ success: z.boolean() }),
  minOptInLevel: null,
  availability: {
    environments: new Set(['platform']),
  },
  needsApproval: true,
  promptGuidance: `- Deploy Edge Functions by calling \`deploy_edge_function\` directly with \`name\` and \`code\`; the client handles confirmation and result presentation.
- Provide example Edge Function code in markdown code blocks (\`\`\`edge\`\`\` or \`\`\`typescript\`\`\`) only upon user request or for illustrative purposes.
- Use \`deploy_edge_function\` solely for deployment, not for presenting example code.
- This tool requires user approval, and tools that need approval must be called one per step: never call it in parallel with another tool that needs approval. Issue one per step and wait for its result before calling the next.`,
  toModelOutput: ({ success }) => ({ success }),
} as const satisfies ToolContract
