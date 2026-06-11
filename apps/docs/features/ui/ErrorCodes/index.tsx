'use client'

import authErrorCodes from '~/content/errorCodes/authErrorCodes.toml'
import realtimeErrorCodes from '~/content/errorCodes/realtimeErrorCodes.toml'
import { type ErrorCodeDefinition } from '~/resources/error/errorTypes'
import { lazy, Suspense } from 'react'

const ErrorCodes = lazy(() => import('./ErrorCodes'))

export function AuthErrorCodes() {
  return (
    <Suspense>
      <ErrorCodes service="auth" />
    </Suspense>
  )
}

AuthErrorCodes.__markdown__ = `
  ${Object.entries(authErrorCodes as Record<string, ErrorCodeDefinition>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, def]) => ` - ${code}: ${def.description}`)
    .join('\n')}
`

export function RealtimeErrorCodes() {
  return (
    <Suspense>
      <ErrorCodes service="realtime" />
    </Suspense>
  )
}

RealtimeErrorCodes.__markdown__ = `
  ${Object.entries(realtimeErrorCodes as Record<string, ErrorCodeDefinition>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, def]) => ` - ${code}: ${def.description}`)
    .join('\n')}
`
