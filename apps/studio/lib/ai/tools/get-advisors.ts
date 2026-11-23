import type { RemoteToolContract } from './types'

export const contract = {
  name: 'get_advisors',
  minOptInLevel: 'schema_and_log',
  availability: {
    environments: new Set(['platform']),
  },
  needsApproval: false,
  promptGuidance: `- Use \`get_advisors\` to identify project issues; if unavailable, suggest the user use the Supabase dashboard.`,
} as const satisfies RemoteToolContract
