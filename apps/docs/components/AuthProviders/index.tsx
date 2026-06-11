'use client'

import providers from '~/data/authProviders'
import { lazy, Suspense } from 'react'

const AuthProviders = lazy(() => import('./AuthProviders'))

export function SocialAuthProviders() {
  return (
    <Suspense>
      <AuthProviders type="social" />
    </Suspense>
  )
}

SocialAuthProviders.__markdown__ = `
  ${providers
    .filter((p) => p.authType === 'social')
    .map((p) => ` - ${p.name}`)
    .join('\n')}
`

export function PhoneAuthProviders() {
  return (
    <Suspense>
      <AuthProviders type="phone" />
    </Suspense>
  )
}

PhoneAuthProviders.__markdown__ = `
  ${providers
    .filter((p) => p.authType === 'phone')
    .map((p) => ` - ${p.name}`)
    .join('\n')}
`
