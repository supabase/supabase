import { ComponentType } from 'react'

import { ConnectionTimeoutTroubleshooting } from './errorMappings/ConnectionTimeout'
import { SupavisorSessionPoolTroubleshooting } from './errorMappings/SupavisorSessionPool'
import { ConnectionTimeoutError, SupavisorSessionPoolError } from '@/lib/errors/studio-errors'
import type { ClassifiedError, StudioErrorInput } from '@/lib/errors/studio-errors'

/** Mapping ID, also sent as `errorType` in troubleshooter telemetry. */
type ErrorMappingId = 'connection-timeout' | 'supavisor-session-pool'

export interface ErrorMapping {
  id: ErrorMappingId
  Troubleshooting: ComponentType
}

type ErrorConstructor = new (input: StudioErrorInput) => ClassifiedError

export const ERROR_MAPPINGS = new Map<ErrorConstructor, ErrorMapping>([
  [
    ConnectionTimeoutError,
    { id: 'connection-timeout', Troubleshooting: ConnectionTimeoutTroubleshooting },
  ],
  [
    SupavisorSessionPoolError,
    { id: 'supavisor-session-pool', Troubleshooting: SupavisorSessionPoolTroubleshooting },
  ],
])
