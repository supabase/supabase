import { QueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeatureFlagContext, LOCAL_STORAGE_KEYS } from 'common'
import { HttpResponse } from 'msw'
import { useCallback } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useFunctionLogsMigration } from './useFunctionLogsMigration'
import { useFunctionsDetailShortcuts } from './useFunctionsDetailShortcuts'
import { FeaturePreviewContextProvider } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import type { EdgeFunction } from '@/data/edge-functions/edge-function-query'
import { navigateToUrl } from '@/lib/navigation'
import { Route as FunctionInvocationsRoute } from '@/routes/project/$ref/functions/$functionSlug/invocations'
import { Route as FunctionLogsRoute } from '@/routes/project/$ref/functions/$functionSlug/logs'
import { customRender, CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { renderRoute } from '@/tests/lib/route-render'

vi.unmock('common')

vi.mock('@/components/interfaces/UnifiedLogs/UnifiedLogs', () => ({
  UnifiedLogs: () => <div>Unified logs</div>,
}))

const featureFlags = {
  configcat: {
    otelLegacyLogs: true,
    pipelineCreationWizard: false,
    platformWebhooks: false,
    jitDbAccess: false,
    explorer: false,
    storageVersioningPrivateAlpha: false,
    sqlEditorManualSaveForced: false,
  },
  posthog: {},
  hasLoaded: true,
}

const FunctionPageProviders = ({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient?: QueryClient
}) => (
  <CustomWrapper queryClient={queryClient}>
    <FeatureFlagContext.Provider value={featureFlags}>
      <FeaturePreviewContextProvider>{children}</FeaturePreviewContextProvider>
    </FeatureFlagContext.Provider>
  </CustomWrapper>
)

beforeEach(() => {
  localStorage.setItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS, 'true')
})

afterEach(() => {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS)
})

it('forwards an invocation bookmark with its selected log, message, and time range to Logs', async () => {
  const legacy = new URLSearchParams({
    its: '2026-03-20T10:00:00Z',
    ite: '2026-03-20T11:00:00Z',
    log: 'selected-invocation',
    s: 'delivery failed',
  })
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/functions/:function_slug',
    response: () =>
      HttpResponse.json<EdgeFunction>({
        id: 'function-id',
        name: 'Send email',
        slug: 'send-email',
        status: 'ACTIVE',
        version: 1,
        created_at: 1774000800000,
        updated_at: 1774000800000,
      }),
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const { router } = await renderRoute(FunctionInvocationsRoute, {
    routeId: '/project/$ref/functions/$functionSlug/invocations',
    url: `/project/default/functions/send-email/invocations?${legacy}`,
    renderOptions: {
      wrapper: ({ children }) => (
        <FunctionPageProviders queryClient={queryClient}>{children}</FunctionPageProviders>
      ),
    },
  })

  await waitFor(() =>
    expect(router.state.location.pathname).toBe('/project/default/functions/send-email/logs')
  )
  const params = new URLSearchParams(router.state.location.searchStr)
  expect(params.get('id')).toBe('selected-invocation')
  expect(params.get('filter')).toBe('event_message:ilike:delivery failed')
  expect(params.get('date')).toBe('1774000800000-1774004400000')
})

function FunctionLogNavigation({ isEnabled = true, isLoading = false }) {
  const asPath = useLocation({ select: (location) => location.href })
  const navigate = useNavigate()
  const onReplace = useCallback(
    (url: string) => void navigateToUrl(navigate, url, { replace: true }),
    [navigate]
  )
  const state = useFunctionLogsMigration({
    asPath,
    onReplace,
    projectRef: 'default',
    functionSlug: 'send-email',
    isEnabled,
    isLoading,
  })
  return <div>{state.shouldUseLegacyLogs ? 'Legacy logs' : 'Unified logs'}</div>
}

it('waits for preview initialization and leaves preview opt-outs on their original bookmark', async () => {
  const bookmark = '/project/default/functions/send-email/logs?log=legacy-log'
  const { router, rerender } = customRender(<FunctionLogNavigation isLoading />, {
    initialUrl: bookmark,
  })
  expect(router.state.location.href).toBe(bookmark)
  rerender(<FunctionLogNavigation isEnabled={false} />)
  expect(router.state.location.href).toBe(bookmark)
  rerender(<FunctionLogNavigation />)
  await waitFor(() => expect(router.state.location.search).toMatchObject({ id: 'legacy-log' }))
})

it('migrates a new legacy Logs bookmark during client-side navigation', async () => {
  const { router } = customRender(<FunctionLogNavigation />, {
    initialUrl: '/project/default/functions/send-email/logs',
  })
  await act(async () => {
    await navigateToUrl(router.navigate, '/project/default/functions/send-email/logs?log=first')
  })
  await waitFor(() => expect(router.state.location.search).toMatchObject({ id: 'first' }))
  await act(async () => {
    await navigateToUrl(router.navigate, '/project/default/functions/send-email/logs?log=second')
  })
  await waitFor(() => expect(router.state.location.search).toMatchObject({ id: 'second' }))
})

it('retains the old function log filters when their meaning cannot migrate to unified filters', () => {
  const filter = encodeURIComponent(JSON.stringify({ severity: { error: true } }))
  const bookmark = `/project/default/functions/send-email/logs?f=${filter}`
  const { router } = customRender(<FunctionLogNavigation />, { initialUrl: bookmark })
  expect(screen.getByText('Legacy logs')).toBeVisible()
  expect(router.state.location.href).toBe(bookmark)
})

function FunctionDetailNavigation({ hasInvocationsTab }: { hasInvocationsTab: boolean }) {
  useFunctionsDetailShortcuts({
    projectRef: 'default',
    functionSlug: 'send-email',
    canReadFunctions: true,
    isPlatform: true,
    hasInvocationsTab,
    onOpenTest: () => {},
    onOpenDownload: () => {},
    onCopyUrl: () => {},
  })
  return <div>Function navigation</div>
}

it('disables the hidden Invocations shortcut while preserving Logs navigation', async () => {
  const user = userEvent.setup()
  const { router, rerender } = customRender(
    <FunctionDetailNavigation hasInvocationsTab={false} />,
    { initialUrl: '/project/default/functions/send-email' }
  )
  await user.keyboard('2')
  expect(router.state.location.href).toBe('/project/default/functions/send-email')
  await user.keyboard('3')
  await waitFor(() =>
    expect(router.state.location.href).toBe('/project/default/functions/send-email/logs')
  )
  rerender(<FunctionDetailNavigation hasInvocationsTab />)
  await user.keyboard('2')
  await waitFor(() =>
    expect(router.state.location.href).toBe('/project/default/functions/send-email/invocations')
  )
})

it('opens a selected log from an old Logs bookmark using the unified time range', async () => {
  const legacy = new URLSearchParams({
    its: '2026-03-20T10:00:00Z',
    ite: '2026-03-20T11:00:00Z',
    log: 'runtime-message',
  })
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/functions/:function_slug',
    response: () =>
      HttpResponse.json<EdgeFunction>({
        id: 'function-id',
        name: 'Send email',
        slug: 'send-email',
        status: 'ACTIVE',
        version: 1,
        created_at: 1774000800000,
        updated_at: 1774000800000,
      }),
  })
  const { router } = await renderRoute(FunctionLogsRoute, {
    routeId: '/project/$ref/functions/$functionSlug/logs',
    url: `/project/default/functions/send-email/logs?${legacy}`,
    renderOptions: { wrapper: FunctionPageProviders },
  })
  expect(await screen.findByText('Unified logs')).toBeVisible()
  const params = new URLSearchParams(router.state.location.searchStr)
  expect(params.get('id')).toBe('runtime-message')
  expect(params.get('date')).toBe('1774000800000-1774004400000')
  expect(params.get('log')).toBeNull()
})
