import { screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

import type { ProfileContextType } from '@/lib/profile'
import APIAuthorizationPage from '@/pages/authorize'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/hooks/misc/withAuth', () => ({
  withAuth: (Component: React.ComponentType) => Component,
}))

const flags = vi.hoisted(() => ({ scopedGrants: false }))
const params = vi.hoisted(() => ({ current: {} as Record<string, string | undefined> }))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => params.current,
    useFlag: () => flags.scopedGrants,
  }
})

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
  afterEach(() => {
    flags.scopedGrants = false
    params.current = {}
  })

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

  test('preselects projects from repeated project_ref params', async () => {
    flags.scopedGrants = true
    useRouterMock.mockReturnValue({
      isReady: true,
      push: routerPushMock,
      query: { project_ref: ['northwindstorefront1', 'northwindcms1'] },
    })

    customRender(<APIAuthorizationPage dehydratedState={{}} />, {
      profileContext: DEFAULT_PROFILE_CONTEXT,
    })

    expect(await screen.findByText('northwind-storefront')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeEnabled()
  })

  test('normalises a single project_ref param to a one-item preselection', async () => {
    flags.scopedGrants = true
    useRouterMock.mockReturnValue({
      isReady: true,
      push: routerPushMock,
      query: { project_ref: 'northwindcms1' },
    })

    customRender(<APIAuthorizationPage dehydratedState={{}} />, {
      profileContext: DEFAULT_PROFILE_CONTEXT,
    })

    expect(await screen.findByText('northwind-cms')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeEnabled()
  })

  test('org_bound_all renders without a picker and covers every project', async () => {
    flags.scopedGrants = true
    params.current = { mock_scenario: 'org_bound_all' }
    useRouterMock.mockReturnValue({ isReady: true, push: routerPushMock, query: {} })

    customRender(<APIAuthorizationPage dehydratedState={{}} />, {
      profileContext: DEFAULT_PROFILE_CONTEXT,
    })

    expect(await screen.findByText('This grant covers every project')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByText('This grant is shared with the whole organization')).toBeInTheDocument()
  })

  test('user_bound_all renders without a picker and covers every project', async () => {
    flags.scopedGrants = true
    params.current = { mock_scenario: 'user_bound_all' }
    useRouterMock.mockReturnValue({ isReady: true, push: routerPushMock, query: {} })

    customRender(<APIAuthorizationPage dehydratedState={{}} />, {
      profileContext: DEFAULT_PROFILE_CONTEXT,
    })

    expect(await screen.findByText('This grant covers every project')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(
      screen.queryByText('This grant is shared with the whole organization')
    ).not.toBeInTheDocument()
  })
})
