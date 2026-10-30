import type { RemoteToolContract } from './types'

export const contract = {
  name: 'get_advisors',
  minOptInLevel: 'schema_and_log',
  availability: {
    environments: new Set(['platform']),
  },
  needsApproval: false,
} as const satisfies RemoteToolContract
