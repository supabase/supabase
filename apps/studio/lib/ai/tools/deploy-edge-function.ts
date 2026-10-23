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
  needsApproval: true,
  toModelOutput: ({ success }) => ({ success }),
} as const satisfies ToolContract
