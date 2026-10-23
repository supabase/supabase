import { z } from 'zod'

import type { ToolContract } from './types'

const inputSchema = z.object({})

const outputSchema = z.object({
  databases: z.array(
    z.object({
      identifier: z.string(),
      is_primary: z.boolean(),
      region: z.string(),
      status: z.string(),
    })
  ),
})

export const contract = {
  name: 'list_databases',
  description: 'List the databases available for this project — the primary and any read replicas.',
  inputSchema,
  outputSchema,
  minOptInLevel: 'schema',
  needsApproval: false,
  toModelOutput: (output: z.infer<typeof outputSchema>) => output,
} as const satisfies ToolContract
