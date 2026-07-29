import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import SignUpPage from '@/pages/sign-up'

const { mockUseSiwcQueryParamOptIn, mockUseIsFeatureEnabled } = vi.hoisted(() => ({
  mockUseSiwcQueryParamOptIn: vi.fn(),
  mockUseIsFeatureEnabled: vi.fn(),
}))

vi.mock('@/hooks/misc/useSiwcQueryParamOptIn', () => ({
  useSiwcQueryParamOptIn: mockUseSiwcQueryParamOptIn,
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockUseIsFeatureEnabled,
}))

vi.mock('@/hooks/misc/useEnabledIdentityProviders', () => ({
  useEnabledIdentityProviders: () => [],
}))

vi.mock('@/hooks/misc/useInboundBranding', () => ({
  useInboundBranding: () => ({ focusProvider: undefined }),
}))

vi.mock('@/components/interfaces/SignIn/SignInWithExternalProvider', () => ({
  SignInWithExternalProvider: () => <div>SignInWithExternalProvider</div>,
}))

vi.mock('@/components/interfaces/SignIn/SignUpForm', () => ({
  SignUpForm: () => <div>SignUpForm</div>,
}))

describe('/sign-up', () => {
  beforeEach(() => {
    mockUseSiwcQueryParamOptIn.mockClear()
    mockUseIsFeatureEnabled.mockReturnValue({ dashboardAuthSignUp: true })
  })

  it('calls useSiwcQueryParamOptIn so a shareable ?siwc-enabled=1 link can opt this browser in', () => {
    render(<SignUpPage dehydratedState={{}} />)

    expect(mockUseSiwcQueryParamOptIn).toHaveBeenCalled()
  })
})
