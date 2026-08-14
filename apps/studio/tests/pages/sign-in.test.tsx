import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import SignInPage from '@/pages/sign-in'

const { mockUseSiwcQueryParamOptIn, mockUseIsFeatureEnabled } = vi.hoisted(() => ({
  mockUseSiwcQueryParamOptIn: vi.fn(),
  mockUseIsFeatureEnabled: vi.fn(),
}))

vi.mock('next/router', () => ({
  useRouter: () => ({ query: {}, replace: vi.fn() }),
}))

vi.mock('@/hooks/misc/useSiwcQueryParamOptIn', () => ({
  useSiwcQueryParamOptIn: mockUseSiwcQueryParamOptIn,
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockUseIsFeatureEnabled,
}))

vi.mock('@/hooks/custom-content/useCustomContent', () => ({
  useCustomContent: () => ({
    dashboardAuthCustomProvider: undefined,
    dashboardAuthCustomProviders: undefined,
  }),
}))

vi.mock('@/hooks/misc/useEnabledIdentityProviders', () => ({
  useEnabledIdentityProviders: () => [],
}))

vi.mock('@/hooks/misc/useInboundBranding', () => ({
  useInboundBranding: () => ({ focusProvider: undefined }),
}))

vi.mock('@/components/interfaces/SignIn/LastSignInWrapper', () => ({
  LastSignInWrapper: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/interfaces/SignIn/SignInForm', () => ({
  SignInForm: () => <div>SignInForm</div>,
}))

vi.mock('@/components/interfaces/SignIn/SignInWithCustom', () => ({
  SignInWithCustom: () => <div>SignInWithCustom</div>,
}))

vi.mock('@/components/interfaces/SignIn/SignInWithExternalProvider', () => ({
  SignInWithExternalProvider: () => <div>SignInWithExternalProvider</div>,
}))

describe('/sign-in', () => {
  beforeEach(() => {
    mockUseSiwcQueryParamOptIn.mockClear()
    mockUseIsFeatureEnabled.mockReturnValue({
      dashboardAuthSignInWithSso: false,
      dashboardAuthSignInWithEmail: false,
      dashboardAuthSignUp: false,
    })
  })

  it('calls useSiwcQueryParamOptIn so a shareable ?siwc-enabled=1 link can opt this browser in', () => {
    render(<SignInPage dehydratedState={{}} />)

    expect(mockUseSiwcQueryParamOptIn).toHaveBeenCalled()
  })
})
