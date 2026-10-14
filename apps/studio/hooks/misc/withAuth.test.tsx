import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { withAuth } from './withAuth'
import { profileKeys } from '@/data/profile/keys'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

const { getAssurance, permissionsRequest, signOut, router } = vi.hoisted(() => ({
  getAssurance: vi.fn(),
  permissionsRequest: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  router: { push: vi.fn(), pathname: '/account/security', query: {} },
}))
vi.mock('next/router', () => ({ useRouter: () => router }))
vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useAuth: () => ({ isLoading: false, session: { user: { id: 'user' } } }),
  useIsLoggedIn: () => true,
}))
vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))
vi.mock('@/lib/gotrue', () => ({ auth: { mfa: { getAuthenticatorAssuranceLevel: getAssurance } } }))
vi.mock('@/lib/auth', () => ({ useSignOut: () => signOut }))
vi.mock('@/components/interfaces/SignIn/SessionTimeoutModal', () => ({
  SessionTimeoutModal: () => null,
}))

const ProtectedPage = withAuth(() => <p>Protected content</p>)

beforeEach(() => {
  vi.clearAllMocks()
  mswServer.use(
    http.get('*/platform/profile/permissions', () => {
      permissionsRequest()
      return HttpResponse.json([])
    })
  )
})

describe('withAuth MFA gating', () => {
  it('does not mount protected content or fetch permissions before MFA is complete', async () => {
    getAssurance.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    customRender(<ProtectedPage />, { queryClient: client })
    await waitFor(() => expect(client.getQueryState(profileKeys.aaLevel())?.status).toBe('success'))
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    expect(permissionsRequest).not.toHaveBeenCalled()
  })

  it('fetches permissions when the session reaches AAL2', async () => {
    getAssurance.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    customRender(<ProtectedPage />, { queryClient: client })
    await waitFor(() => expect(client.getQueryState(profileKeys.aaLevel())?.status).toBe('success'))
    getAssurance.mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
      error: null,
    })
    await client.invalidateQueries({ queryKey: profileKeys.aaLevel() })
    expect(await screen.findByText('Protected content')).toBeInTheDocument()
    await waitFor(() => expect(permissionsRequest).toHaveBeenCalledOnce())
  })

  it('allows ordinary sessions for accounts without MFA', async () => {
    getAssurance.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    })
    customRender(<ProtectedPage />)
    expect(await screen.findByText('Protected content')).toBeInTheDocument()
    await waitFor(() => expect(permissionsRequest).toHaveBeenCalledOnce())
  })
})
