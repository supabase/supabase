import { z } from 'zod'

import type { ToolContract } from './types'

const inputSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Escalation reason is required')
    .describe('A short reason that explains why this support chat should be escalated.'),
})

export const contract = {
  name: 'escalate_to_human',
  description:
    'Escalate this support conversation to a human support agent when the assistant cannot resolve the issue.',
  inputSchema,
  outputSchema: z.object({ status: z.string() }),
  minOptInLevel: null,
  availability: {
    environments: new Set(['platform']),
    requires: new Set(['supportMode']),
  },
  needsApproval: false,
  promptGuidance: `- If the user asks for a human, or if the issue cannot be safely resolved, call \`escalate_to_human\` with a short reason.`,
  toModelOutput: ({ status }) => ({ status }),
} as const satisfies ToolContract
