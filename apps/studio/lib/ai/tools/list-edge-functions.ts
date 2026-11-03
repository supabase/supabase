import type { RemoteToolContract } from './types'

export const contract = {
  name: 'list_edge_functions',
  minOptInLevel: 'schema',
  availability: {
    environments: new Set(['platform']),
  },
  needsApproval: false,
  promptGuidance: `- For Edge Function interactions, use \`list_edge_functions\` to understand the current Edge Functions.`,
} as const satisfies RemoteToolContract
