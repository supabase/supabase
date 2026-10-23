import type { RemoteToolContract } from './types'

export const contract = {
  name: 'list_edge_functions',
  minOptInLevel: 'schema',
  needsApproval: false,
} as const satisfies RemoteToolContract
