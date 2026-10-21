import { z } from 'zod'

import type { ToolContract } from './types'

const inputSchema = z.object({
  schemas: z.array(z.string()).describe('The schema names to get the policies for'),
})

export const contract = {
  name: 'list_policies',
  description: 'Get existing RLS policies for a given schema',
  inputSchema,
  outputSchema: z.string(),
  minOptInLevel: 'schema',
  needsApproval: false,
  toModelOutput: (output: string) => output,
} as const satisfies ToolContract
