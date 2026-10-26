import { z } from 'zod'

import type { ToolContract } from './types'

const inputSchema = z.object({
  summary: z
    .string()
    .trim()
    .min(1, 'Resolution summary is required')
    .describe('A concise summary of the fix or guidance that resolved the support request.'),
})

export const contract = {
  name: 'resolve_support_conversation',
  description:
    'Mark this support conversation as resolved when the issue appears solved from the user perspective.',
  inputSchema,
  outputSchema: z.object({ status: z.string() }),
  minOptInLevel: null,
  needsApproval: false,
  toModelOutput: ({ status }) => ({ status }),
} as const satisfies ToolContract
