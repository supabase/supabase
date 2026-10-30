import type { RemoteToolContract } from './types'

export const contract = {
  name: 'search_docs',
  minOptInLevel: null,
  availability: {
    environments: new Set(['platform']),
  },
  needsApproval: false,
} as const satisfies RemoteToolContract
