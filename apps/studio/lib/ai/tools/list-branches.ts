import type { RemoteToolContract } from './types'

export const contract = {
  name: 'list_branches',
  minOptInLevel: 'schema',
  availability: {
    environments: new Set(['platform']),
  },
  needsApproval: false,
} as const satisfies RemoteToolContract
