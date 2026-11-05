import { ComponentType } from 'react'

import { ConnectionTimeoutTroubleshooting } from './errorMappings/ConnectionTimeout'
import { ConnectionTimeoutError } from '@/lib/errors/studio-errors'
import type { ClassifiedError, StudioErrorInput } from '@/lib/errors/studio-errors'

/** Mapping ID, also sent as `errorType` in troubleshooter telemetry. */
type ErrorMappingId = 'connection-timeout'

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
])
