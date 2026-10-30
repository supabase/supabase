import type { RemoteToolContract } from './types'

export const contract = {
  name: 'list_tables',
  minOptInLevel: 'schema',
  availability: {
    environments: new Set(['platform']),
  },
  needsApproval: false,
  promptGuidance: `- For database interactions, use \`list_tables\` to understand the current schema.`,
} as const satisfies RemoteToolContract
