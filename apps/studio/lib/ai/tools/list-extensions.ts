import type { RemoteToolContract } from './types'

export const contract = {
  name: 'list_extensions',
  minOptInLevel: 'schema',
  availability: {
    environments: new Set(['platform']),
  },
  needsApproval: false,
  promptGuidance: `- For database interactions, use \`list_extensions\` to understand which extensions are installed.`,
} as const satisfies RemoteToolContract
