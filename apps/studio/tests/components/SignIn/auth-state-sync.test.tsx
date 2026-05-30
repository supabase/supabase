import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { SignInForm } from '@/components/interfaces/SignIn/SignInForm'
import SignInLayout from '@/components/layouts/SignInLayout/SignInLayout'
import { customRender } from '@/tests/lib/custom-render'
import { routerMock } from '@/tests/lib/route-mock'

const mocks = vi.hoisted(() => ({
  refreshSession: vi.fn(),
  useAuth: vi.fn(),
  useFlag: vi.fn(),
  getAccessToken: vi.fn(),
  signInWithPassword: vi.fn(),
  initialize: vi.fn(),
  getAuthenticatorAssuranceLevel: vi.fn(),
  getMfaAuthenticatorAssuranceLevel: vi.fn(),
  buildPathWithParams: vi.fn((path: string) => path),
  getReturnToPath: vi.fn(() => '/organizations'),
  addLoginEvent: vi.fn(),
  useTrack: vi.fn(),
  setLastSignIn: vi.fn(),
  toastLoading: vi.fn(() => 'toast-id'),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  captchaExecute: vi.fn().mockResolvedValue({ response: 'captcha-token' }),
  captchaReset: vi.fn(),
}))

vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('common')
  return {
    ...actual,
    useAuth: mocks.useAuth,
    useFlag: mocks.useFlag,
    getAccessToken: mocks.getAccessToken,
  }
})

vi.mock('sonner', () => ({
  toast: {
    loading: mocks.toastLoading,
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}))

vi.mock('@hcaptcha/react-hcaptcha', () => ({
  default: React.forwardRef(function MockHCaptcha(_props: any, ref: any) {
    React.useImperativeHandle(ref, () => ({
      execute: mocks.captchaExecute,
      resetCaptcha: mocks.captchaReset,
    }))

    return <div data-testid="hcaptcha" />
  }),
}))

vi.mock('@/lib/gotrue', () => ({
  auth: {
    signInWithPassword: mocks.signInWithPassword,
    initialize: mocks.initialize,
    mfa: {
      getAuthenticatorAssuranceLevel: mocks.getAuthenticatorAssuranceLevel,
    },
  },
  buildPathWithParams: mocks.buildPathWithParams,
  getReturnToPath: mocks.getReturnToPath,
}))

vi.mock('@/data/profile/mfa-authenticator-assurance-level-query', () => ({
  getMfaAuthenticatorAssuranceLevel: mocks.getMfaAuthenticatorAssuranceLevel,
}))

vi.mock('@/data/misc/audit-login-mutation', () => ({
  useAddLoginEvent: () => ({ mutate: mocks.addLoginEvent }),
}))

vi.mock('@/lib/telemetry/track', () => ({
  useTrack: () => mocks.useTrack,
}))

vi.mock('@/hooks/misc/useLastSignIn', () => ({
  useLastSignIn: () => [null, mocks.setLastSignIn] as const,
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => ({
    dashboardAuthShowTestimonial: false,
    brandingLargeLogo: false,
    dashboardAuthShowTos: false,
  }),
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'dark' }),
}))

describe('auth state sync', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await routerMock.push('/sign-in')

    mocks.useAuth.mockReturnValue({ error: null, refreshSession: mocks.refreshSession })
    mocks.useFlag.mockReturnValue(false)
    mocks.refreshSession.mockResolvedValue({ access_token: 'token', user: { id: 'user-1' } })
    mocks.getAccessToken.mockResolvedValue(null)
    mocks.signInWithPassword.mockResolvedValue({ error: null })
    mocks.initialize.mockResolvedValue({ error: null })
    mocks.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    })
    mocks.getMfaAuthenticatorAssuranceLevel.mockResolvedValue({
      currentLevel: 'aal1',
      nextLevel: 'aal1',
    })
  })

  test('refreshes auth state before redirecting after email sign in', async () => {
    const user = userEvent.setup()
    const pushSpy = vi.spyOn(routerMock, 'push')

    customRender(<SignInForm />)

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'Password123!')
    fireEvent.submit(document.getElementById('sign-in-form')!)

    await waitFor(() => {
      expect(mocks.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Password123!',
        options: { captchaToken: 'captcha-token' },
      })
    })

    await waitFor(() => {
      expect(mocks.refreshSession).toHaveBeenCalledTimes(1)
      expect(pushSpy).toHaveBeenCalledWith('/organizations')
    })

    expect(mocks.refreshSession.mock.invocationCallOrder[0]).toBeLessThan(
      pushSpy.mock.invocationCallOrder.at(-1)!
    )
  })

  test('refreshes auth state before redirecting after URL-based auth completes', async () => {
    const pushSpy = vi.spyOn(routerMock, 'push')
    mocks.getAccessToken.mockResolvedValue('token')

    customRender(
      <SignInLayout heading="Welcome back" subheading="Sign in to your account">
        <div>content</div>
      </SignInLayout>
    )

    await waitFor(() => {
      expect(mocks.initialize).toHaveBeenCalledTimes(1)
      expect(mocks.refreshSession).toHaveBeenCalledTimes(1)
      expect(pushSpy).toHaveBeenCalledWith('/organizations')
    })

    expect(mocks.refreshSession.mock.invocationCallOrder[0]).toBeLessThan(
      pushSpy.mock.invocationCallOrder.at(-1)!
    )
  })
})
