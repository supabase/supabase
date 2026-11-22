import { screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/project/$ref/logs/index'
import { renderRoute } from '@/tests/lib/route-render'

const { authState, unifiedLogsPreviewState, signOut } = vi.hoisted(() => ({
  signOut: () => Promise.resolve(),
  authState: { current: { isLoading: false, session: null as object | null } },
  unifiedLogsPreviewState: { current: { isEnabled: true, isLoading: false } },
}))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useAuth: () => authState.current,
  }
})

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>()
  return { ...actual, useSignOut: () => signOut }
})

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => true,
}))

vi.mock('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  useUnifiedLogsPreview: () => unifiedLogsPreviewState.current,
}))

vi.mock('@/components/layouts/ProjectLayout', () => ({
  ProjectLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/interfaces/UnifiedLogs/UnifiedLogs', () => ({
  UnifiedLogs: () => <div>Unified logs view</div>,
}))

const renderLogsIndex = () =>
  renderRoute(Route, { routeId: '/project/$ref/logs/', url: '/project/default/logs' })

describe('/project/$ref/logs', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/project/default/logs')
  })

  afterEach(() => {
    authState.current = { isLoading: false, session: null }
    unifiedLogsPreviewState.current = { isEnabled: true, isLoading: false }
  })

  it('redirects to sign-in with a return destination when there is no session', async () => {
    const { router } = await renderLogsIndex()

    await waitFor(() => expect(router.state.location.pathname).toBe('/sign-in'))
    expect(router.state.location.search).toEqual({ returnTo: '/project/default/logs' })
  })

  it('redirects to sign-in while the unified logs preview is still loading', async () => {
    unifiedLogsPreviewState.current = { isEnabled: false, isLoading: true }

    const { router } = await renderLogsIndex()

    await waitFor(() => expect(router.state.location.pathname).toBe('/sign-in'))
    expect(router.state.location.search).toEqual({ returnTo: '/project/default/logs' })
  })

  it('renders the logs view when signed in', async () => {
    authState.current = { isLoading: false, session: { user: { id: 'user-id' } } }

    const { router } = await renderLogsIndex()

    expect(await screen.findByText('Unified logs view')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/project/default/logs')
  })

  it('redirects to the logs explorer when unified logs is disabled', async () => {
    authState.current = { isLoading: false, session: { user: { id: 'user-id' } } }
    unifiedLogsPreviewState.current = { isEnabled: false, isLoading: false }

    const { router } = await renderLogsIndex()

    await vi.waitFor(() =>
      expect(router.state.location.pathname).toBe('/project/default/logs/explorer')
    )
  })
})
