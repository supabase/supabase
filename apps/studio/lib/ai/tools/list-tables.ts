import type { RemoteToolContract } from './types'

export const contract = {
  name: 'list_tables',
  minOptInLevel: 'schema',
  availability: {
    environments: new Set(['platform']),
  },
  needsApproval: false,
} as const satisfies RemoteToolContract
