import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from 'ui'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { ExternalIdentityProviderConfig } from '@/lib/external-identity-providers'
import SignUpPage from '@/pages/sign-up'
import { customRender } from '@/tests/lib/custom-render'

const mocks = vi.hoisted(() => ({
  focusProvider: undefined as ExternalIdentityProviderConfig | undefined,
}))

const githubProvider = {
  id: 'github',
  authProvider: 'github',
  displayName: 'GitHub',
  showOnSignIn: true,
  showOnSignUp: true,
} as ExternalIdentityProviderConfig

const chatgptProvider = {
  id: 'chatgpt',
  authProvider: 'workos',
  displayName: 'ChatGPT',
  showOnSignIn: true,
  showOnSignUp: true,
} as ExternalIdentityProviderConfig

vi.mock('@/components/interfaces/SignIn/SignInWithExternalProvider', () => ({
  SignInWithExternalProvider: ({ provider }: { provider: ExternalIdentityProviderConfig }) => (
    <Button>Continue with {provider.displayName}</Button>
  ),
}))

vi.mock('@/components/interfaces/SignIn/SignUpForm', () => ({
  SignUpForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <>
      <Button onClick={onSuccess}>Complete email sign-up</Button>
      <div>Check your email to confirm</div>
    </>
  ),
}))

vi.mock('@/hooks/misc/useEnabledIdentityProviders', () => ({
  useEnabledIdentityProviders: () => [githubProvider, chatgptProvider],
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

    await user.click(screen.getByRole('button', { name: 'Complete email sign-up' }))

    expect(screen.queryByRole('button', { name: 'Continue with GitHub' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continue with ChatGPT' })).not.toBeInTheDocument()
    expect(screen.queryByText('or')).not.toBeInTheDocument()
    expect(screen.getByText('Check your email to confirm')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in')
  })

  test('hides the focused provider after email sign-up succeeds', async () => {
    const user = userEvent.setup()
    mocks.focusProvider = githubProvider
    customRender(<SignUpPage dehydratedState={undefined} />)

    expect(screen.getByRole('button', { name: 'Continue with GitHub' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show other options' }))
    await user.click(screen.getByRole('button', { name: 'Complete email sign-up' }))

    expect(screen.queryByRole('button', { name: 'Continue with GitHub' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continue with ChatGPT' })).not.toBeInTheDocument()
    expect(screen.queryByText('or')).not.toBeInTheDocument()
    expect(screen.getByText('Check your email to confirm')).toBeInTheDocument()
  })
})
