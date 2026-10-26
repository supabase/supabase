import type { RemoteToolContract } from './types'

export const contract = {
  name: 'list_extensions',
  minOptInLevel: 'schema',
  needsApproval: false,
} as const satisfies RemoteToolContract
