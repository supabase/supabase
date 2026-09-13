import { ComponentType } from 'react'

import { ConnectionTimeoutTroubleshooting } from './errorMappings/ConnectionTimeout'
import { ConnectionTimeoutError } from '@/types/api-errors'
import type { ClassifiedError, KnownErrorType } from '@/types/api-errors'
import type { ResponseError } from '@/types/base'

export interface ErrorMapping {
  id: KnownErrorType
  Troubleshooting: ComponentType
}

type ErrorConstructor = new (
  ...args: ConstructorParameters<typeof ResponseError>
) => ClassifiedError

export const ERROR_MAPPINGS = new Map<ErrorConstructor, ErrorMapping>([
  [
    ConnectionTimeoutError,
    { id: 'connection-timeout', Troubleshooting: ConnectionTimeoutTroubleshooting },
  ],
])
