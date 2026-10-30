import type { RemoteToolContract } from './types'

export const contract = {
  name: 'list_edge_functions',
  minOptInLevel: 'schema',
  availability: {
    environments: new Set(['platform']),
  },
  needsApproval: false,
} as const satisfies RemoteToolContract
