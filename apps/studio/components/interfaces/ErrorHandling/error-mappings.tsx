import type { ReactNode } from 'react'
import type { ErrorDisplayStep } from 'ui-patterns/ErrorDisplay'

import { useConnectionTimeoutTroubleshooting } from './errorMappings/ConnectionTimeout'
import { ConnectionTimeoutError } from '@/types/api-errors'
import type { ClassifiedError, KnownErrorType } from '@/types/api-errors'
import type { ResponseError } from '@/types/base'

export interface TroubleshootingContent {
  /** ID reported on every troubleshooter telemetry event. Omitted when there is no mapping. */
  errorType?: string
  steps: ErrorDisplayStep[]
  /** Dialogs the steps open. Rendered alongside the steps, and invisible until opened. */
  overlays?: ReactNode
}

export type UseTroubleshooting = () => TroubleshootingContent

export interface ErrorMapping {
  id: KnownErrorType
  useTroubleshooting: UseTroubleshooting
}

type ErrorConstructor = new (
  ...args: ConstructorParameters<typeof ResponseError>
) => ClassifiedError

export const ERROR_MAPPINGS = new Map<ErrorConstructor, ErrorMapping>([
  [
    ConnectionTimeoutError,
    { id: 'connection-timeout', useTroubleshooting: useConnectionTimeoutTroubleshooting },
  ],
])
