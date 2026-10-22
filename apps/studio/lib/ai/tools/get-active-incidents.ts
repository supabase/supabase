import { z } from 'zod'

import type { ToolContract } from './types'

const inputSchema = z.object({})

const outputSchema = z.object({
  incidents: z.array(
    z.object({
      kind: z.enum(['incident', 'maintenance']),
      name: z.string(),
      status: z.string(),
      impact: z.string().optional(),
      affected_components: z.array(z.string()),
      last_update_message: z.string().nullable(),
      url: z.string(),
      started_at: z.string().optional(),
    })
  ),
  message: z.string(),
})

export const contract = {
  name: 'get_active_incidents',
  description:
    'Check for active incidents. Use this tool when the user reports issues with any Supabase service, including the database, authentication, realtime, storage, and functions. Possible problems include, but are not limited to, connection issues, timeouts, service unavailability, authentication failures, or unexpected errors.',
  inputSchema,
  outputSchema,
  minOptInLevel: null,
  needsApproval: false,
  toModelOutput: (output: z.infer<typeof outputSchema>) => output,
} as const satisfies ToolContract
