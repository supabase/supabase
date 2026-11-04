import { ComponentType } from 'react'

import { ConnectionTimeoutTroubleshooting } from './errorMappings/ConnectionTimeout'
import { ConnectionTimeoutError } from '@/lib/errors/studio-errors'
import type { ClassifiedError, KnownErrorType, StudioError } from '@/lib/errors/studio-errors'

export interface ErrorMapping {
  id: KnownErrorType
  Troubleshooting: ComponentType
}

type ErrorConstructor = new (...args: ConstructorParameters<typeof StudioError>) => ClassifiedError

export const ERROR_MAPPINGS = new Map<ErrorConstructor, ErrorMapping>([
  [
    ConnectionTimeoutError,
    { id: 'connection-timeout', Troubleshooting: ConnectionTimeoutTroubleshooting },
  ],
])
