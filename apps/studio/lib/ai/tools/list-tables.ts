import type { RemoteToolContract } from './types'

export const contract = {
  name: 'list_tables',
  minOptInLevel: 'schema',
  needsApproval: false,
} as const satisfies RemoteToolContract
