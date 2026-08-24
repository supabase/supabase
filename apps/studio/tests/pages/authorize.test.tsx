import { screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import type { ProfileContextType } from '@/lib/profile'
import APIAuthorizationPage from '@/pages/authorize'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/hooks/misc/withAuth', () => ({
  withAuth: (Component: React.ComponentType) => Component,
}))

const routerPushMock = vi.fn()
const useRouterMock = vi.fn(() => ({
  isReady: false,
  push: routerPushMock,
  query: {},
}))

vi.mock('next/router', () => ({
  useRouter: () => useRouterMock(),
}))

const DEFAULT_PROFILE_CONTEXT: ProfileContextType = {
  profile: {
    id: 1,
    auth0_id: 'auth0|test',
    gotrue_id: 'gotrue-test',
    username: 'testuser',
    primary_email: 'test@example.com',
    first_name: null,
    last_name: null,
    mobile: null,
    is_alpha_user: false,
    is_sso_user: false,
    disabled_features: [],
    free_project_limit: null,
  },
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
}

describe('APIAuthorizationPage', () => {
  test('renders loading interstitial while router is not ready', () => {
    customRender(<APIAuthorizationPage dehydratedState={{}} />, {
      profileContext: DEFAULT_PROFILE_CONTEXT,
    })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('renders the legacy component when the OauthAppScopedGrants flag is off', () => {
    useRouterMock.mockReturnValue({ isReady: true, push: routerPushMock, query: {} })

    customRender(<APIAuthorizationPage dehydratedState={{}} />, {
      profileContext: DEFAULT_PROFILE_CONTEXT,
    })

    expect(screen.getByText('Missing authorization link')).toBeInTheDocument()
    expect(screen.queryByText(/is connected/)).not.toBeInTheDocument()
  })
})
