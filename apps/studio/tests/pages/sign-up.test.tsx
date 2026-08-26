import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Button } from 'ui'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  CHATGPT_IDENTITY_PROVIDER,
  GITHUB_IDENTITY_PROVIDER,
  type ExternalIdentityProviderConfig,
} from '@/lib/external-identity-providers'
import SignUpPage from '@/pages/sign-up'
import { customRender } from '@/tests/lib/custom-render'

const mocks = vi.hoisted(() => ({
  focusProvider: undefined as ExternalIdentityProviderConfig | undefined,
}))

vi.mock('@/components/interfaces/SignIn/SignInWithExternalProvider', () => ({
  SignInWithExternalProvider: ({ provider }: { provider: ExternalIdentityProviderConfig }) => (
    <Button>Continue with {provider.displayName}</Button>
  ),
}))

vi.mock('@/components/interfaces/SignIn/SignUpForm', () => ({
  SignUpForm: ({ onSuccess }: { onSuccess?: () => void }) => {
    const [isSubmitted, setIsSubmitted] = useState(false)

    return (
      <>
        <Button
          onClick={() => {
            setIsSubmitted(true)
            onSuccess?.()
          }}
        >
          Complete email sign-up
        </Button>
        {isSubmitted && <div>Check your email</div>}
      </>
    )
  },
}))

vi.mock('@/hooks/misc/useEnabledIdentityProviders', () => ({
  useEnabledIdentityProviders: () => [GITHUB_IDENTITY_PROVIDER, CHATGPT_IDENTITY_PROVIDER],
}))

vi.mock('@/hooks/misc/useInboundBranding', () => ({
  useInboundBranding: () => ({ focusProvider: mocks.focusProvider }),
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => ({ dashboardAuthSignUp: true }),
}))

describe('SignUpPage', () => {
  beforeEach(() => {
    mocks.focusProvider = undefined
  })

  test('hides social sign-up options after email sign-up succeeds', async () => {
    const user = userEvent.setup()
    customRender(<SignUpPage dehydratedState={undefined} />)

    expect(screen.getByRole('button', { name: 'Continue with GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue with ChatGPT' })).toBeInTheDocument()
    expect(screen.getByText('or')).toBeInTheDocument()
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Complete email sign-up' }))

    expect(screen.queryByRole('button', { name: 'Continue with GitHub' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continue with ChatGPT' })).not.toBeInTheDocument()
    expect(screen.queryByText('or')).not.toBeInTheDocument()
    expect(screen.getByText('Check your email')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in')
  })

  test('hides the focused provider after email sign-up succeeds', async () => {
    const user = userEvent.setup()
    mocks.focusProvider = GITHUB_IDENTITY_PROVIDER
    customRender(<SignUpPage dehydratedState={undefined} />)

    expect(screen.getByRole('button', { name: 'Continue with GitHub' })).toBeInTheDocument()
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show other options' }))
    await user.click(screen.getByRole('button', { name: 'Complete email sign-up' }))

    expect(screen.queryByRole('button', { name: 'Continue with GitHub' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continue with ChatGPT' })).not.toBeInTheDocument()
    expect(screen.queryByText('or')).not.toBeInTheDocument()
    expect(screen.getByText('Check your email')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in')
  })
})
