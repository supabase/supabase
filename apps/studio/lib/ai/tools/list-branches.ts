import type { RemoteToolContract } from './types'

export const contract = {
  name: 'list_branches',
  minOptInLevel: 'schema',
  needsApproval: false,
} as const satisfies RemoteToolContract
