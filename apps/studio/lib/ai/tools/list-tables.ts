import { z } from 'zod'

import { listTablesOutputSchema, type ListTablesOutput } from './list-tables-output'
import { LIST_TABLES_PROMPT_GUIDANCE } from './list-tables.remote'
import type { ToolContract } from './types'

// Mirrors the remote MCP `list_tables` tool, which exists only on platform.
const inputSchema = z.object({
  schemas: z
    .array(z.string())
    .describe('List of schemas to include. Defaults to public.')
    .default(['public']),
  verbose: z
    .boolean()
    .describe(
      'When true, includes column details, primary keys, and foreign key constraints. Defaults to false for a compact summary.'
    )
    .default(false),
})

export const contract = {
  name: 'list_tables',
  description:
    'Lists all tables, views, materialized views, and foreign tables in one or more schemas. By default returns a compact summary. Set verbose to true to include column details, primary keys, and foreign key constraints.',
  inputSchema,
  outputSchema: listTablesOutputSchema,
  minOptInLevel: 'schema',
  availability: {
    environments: new Set(['self-hosted']),
  },
  needsApproval: false,
  promptGuidance: LIST_TABLES_PROMPT_GUIDANCE,
  toModelOutput: (output: ListTablesOutput) => output,
} as const satisfies ToolContract
