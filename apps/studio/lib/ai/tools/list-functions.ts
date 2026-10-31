import { z } from 'zod'

import type { ToolContract } from './types'

const inputSchema = z.object({
  schemas: z.array(z.string()).describe('The schema names to get the functions for'),
})

const outputSchema = z.array(
  z.object({
    schema: z.string(),
    name: z.string(),
    argument_types: z.string(),
    // Null for procedures, which have no result type.
    return_type: z.string().nullable(),
    language: z.string(),
    definition: z.string(),
  })
)

// Exists only off platform, where there is no remote MCP server to list functions.
export const contract = {
  name: 'list_functions',
  description: 'Get database functions for one or more schemas',
  inputSchema,
  outputSchema,
  minOptInLevel: 'schema',
  availability: {
    environments: new Set(['self-hosted']),
  },
  needsApproval: false,
  toModelOutput: (output: z.infer<typeof outputSchema>) => output,
} as const satisfies ToolContract
