import type { RemoteToolContract } from './types'

export const contract = {
  name: 'search_docs',
  minOptInLevel: null,
  needsApproval: false,
} as const satisfies RemoteToolContract
