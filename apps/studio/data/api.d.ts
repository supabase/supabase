/**
 * Studio API paths include temporary replication response compatibility for rollout.
 * Import resource schemas directly from 'api-types'.
 */
export type * from 'api-types'

export type { ReplicationCompatiblePaths as paths } from './replication/api-types'
