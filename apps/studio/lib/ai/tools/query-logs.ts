import type { RemoteToolContract } from './types'

export const contract = {
  name: 'query_logs',
  minOptInLevel: 'schema_and_log',
  needsApproval: false,
} as const satisfies RemoteToolContract
