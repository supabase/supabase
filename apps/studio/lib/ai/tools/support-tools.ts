import { tool } from 'ai'
import { z } from 'zod'

export const getSupportLifecycleTools = () => ({
  escalate_to_human: tool({
    description:
      'Escalate this support conversation to a human support agent when the assistant cannot resolve the issue.',
    inputSchema: z.object({
      reason: z
        .string()
        .trim()
        .min(1, 'Escalation reason is required')
        .describe('A short reason that explains why this support chat should be escalated.'),
    }),
    execute: async () => {
      return { status: 'Escalation request sent to client.' }
    },
  }),
  resolve_support_conversation: tool({
    description:
      'Mark this support conversation as resolved when the issue appears solved from the user perspective.',
    inputSchema: z.object({
      summary: z
        .string()
        .trim()
        .min(1, 'Resolution summary is required')
        .describe('A concise summary of the fix or guidance that resolved the support request.'),
    }),
    execute: async () => {
      return { status: 'Resolve request sent to client.' }
    },
  }),
})
