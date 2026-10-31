import type { RemoteToolContract } from './types'

/** Shared with the self-hosted contract, which wins the prompt when both are registered. */
export const LIST_TABLES_PROMPT_GUIDANCE = `- For database interactions, use \`list_tables\` to understand the current schema.`

export const contract = {
  name: 'list_tables',
  minOptInLevel: 'schema',
  availability: {
    environments: new Set(['platform']),
  },
  needsApproval: false,
  promptGuidance: LIST_TABLES_PROMPT_GUIDANCE,
} as const satisfies RemoteToolContract
