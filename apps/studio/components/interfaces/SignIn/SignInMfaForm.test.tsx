import { screen } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import { beforeEach, expect, test, vi } from 'vitest'

import { SignInMfaForm } from './SignInMfaForm'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('returnTo=%2Fproject%2Fexample'),
}))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(auth.mfa, 'listFactors').mockResolvedValue({
    data: {
      all: [],
      totp: [
        {
          id: 'factor-a',
          factor_type: 'totp',
          status: 'verified',
          created_at: '',
          updated_at: '',
        },
      ],
      phone: [],
      webauthn: [],
      recovery_code: [],
    },
    error: null,
  })
  vi.spyOn(auth.mfa.recoveryCodes, 'getStatus').mockResolvedValue({
    data: { id: 'codes-a', type: 'recovery_code', remaining: 3, total: 10 },
    error: null,
  })
})

test.each(['forgot-password', 'sign-in'] as const)(
  '%s preserves the destination when offering recovery codes',
  async (context) => {
    customRender(
      <FeatureFlagContext.Provider
        value={{ configcat: { enableAuthRecoveryCodes: true }, posthog: {}, hasLoaded: true }}
      >
        <SignInMfaForm context={context} />
      </FeatureFlagContext.Provider>
    )

    const link = await screen.findByRole('link', { name: 'Authenticate using a recovery code' })
    const url = new URL(link.getAttribute('href') ?? '', window.location.origin)
    expect(url.pathname).toBe('/sign-in-recovery-code')
    expect(url.searchParams.get('returnTo')).toBe('/project/example')
    expect(url.searchParams.get('context')).toBe(
      context === 'forgot-password' ? 'forgot-password' : null
    )
  }
)
