import { act, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/project/$ref/logs/index'
import { routerMock } from '@/tests/lib/route-mock'
import { renderRoute } from '@/tests/lib/route-render'

const { authState, unifiedLogsPreviewState } = vi.hoisted(() => ({
  authState: { current: { isLoading: false, session: null as object | null } },
  unifiedLogsPreviewState: { current: { isEnabled: true, isLoading: false } },
}))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => ({ ref: 'default' }),
    useAuth: () => authState.current,
  }
})

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>()
  return { ...actual, useSignOut: () => () => Promise.resolve() }
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
    routerMock.setCurrentUrl('/project/default/logs')
  })

  afterEach(() => {
    authState.current = { isLoading: false, session: null }
    unifiedLogsPreviewState.current = { isEnabled: true, isLoading: false }
    act(() => routerMock.setCurrentUrl('/'))
  })

  it('redirects to sign-in with a return destination when there is no session', async () => {
    await renderLogsIndex()

    await waitFor(() => expect(routerMock.pathname).toBe('/sign-in'))
    expect(routerMock.query.returnTo).toBe('/project/default/logs')
  })

  it('redirects to sign-in while the unified logs preview is still loading', async () => {
    unifiedLogsPreviewState.current = { isEnabled: false, isLoading: true }

    await renderLogsIndex()

    await waitFor(() => expect(routerMock.pathname).toBe('/sign-in'))
    expect(routerMock.query.returnTo).toBe('/project/default/logs')
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
