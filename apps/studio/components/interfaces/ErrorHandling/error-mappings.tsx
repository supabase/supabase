import { ComponentType } from 'react'
import { ConnectionTimeoutError } from 'types/api-errors'
import type { ClassifiedError, KnownErrorType } from 'types/api-errors'

import { ConnectionTimeoutTroubleshooting } from './errorMappings/ConnectionTimeout'

export interface ErrorMapping {
  id: KnownErrorType
  Troubleshooting: ComponentType
}

type ErrorConstructor = new (...args: any[]) => ClassifiedError

export const ERROR_MAPPINGS = new Map<ErrorConstructor, ErrorMapping>([
  [
    ConnectionTimeoutError,
    { id: 'connection-timeout', Troubleshooting: ConnectionTimeoutTroubleshooting },
  ],
])
