import { QueryClient } from '@tanstack/react-query'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeatureFlagContext, LOCAL_STORAGE_KEYS } from 'common'
import { HttpResponse } from 'msw'
import { createDynamicRouteParser } from 'next-router-mock/dynamic-routes'
import { useRouter } from 'next/router'
import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useFunctionLogsMigration } from './useFunctionLogsMigration'
import { useFunctionsDetailShortcuts } from './useFunctionsDetailShortcuts'
import { FeaturePreviewContextProvider } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import type { EdgeFunction } from '@/data/edge-functions/edge-function-query'
import { LogPage } from '@/pages/project/[ref]/functions/[functionSlug]/invocations'
import { LogPage as FunctionLogsPage } from '@/pages/project/[ref]/functions/[functionSlug]/logs'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

vi.unmock('common')

const { default: routerMock } =
  await vi.importMock<typeof import('next-router-mock')>('next/router')
const removeRouteParser = routerMock.useParser(
  createDynamicRouteParser([
    '/project/[ref]/functions/[functionSlug]',
    '/project/[ref]/functions/[functionSlug]/logs',
    '/project/[ref]/functions/[functionSlug]/invocations',
  ])
)
afterAll(removeRouteParser)

const featureFlags = {
  configcat: {
    otelLegacyLogs: true,
    pipelineCreationWizard: false,
    platformWebhooks: false,
    jitDbAccess: false,
    marketplaceIntegrations: false,
    explorer: false,
    storageVersioningPrivateAlpha: false,
    sqlEditorManualSaveForced: false,
  },
  posthog: {},
  hasLoaded: true,
}

beforeEach(() => {
  routerMock.setCurrentUrl('/project/default/functions/send-email/invocations')
  localStorage.setItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS, 'true')
})

afterEach(() => {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS)
  act(() => routerMock.setCurrentUrl('/'))
})

it('forwards an invocation bookmark with its selected log, message, and time range to Logs', async () => {
  const legacy = new URLSearchParams({
    its: '2026-03-20T10:00:00Z',
    ite: '2026-03-20T11:00:00Z',
    log: 'selected-invocation',
    s: 'delivery failed',
  })
  routerMock.setCurrentUrl(`/project/default/functions/send-email/invocations?${legacy}`)
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
  customRender(
    <FeatureFlagContext.Provider value={featureFlags}>
      <FeaturePreviewContextProvider>
        <LogPage dehydratedState={undefined} />
      </FeaturePreviewContextProvider>
    </FeatureFlagContext.Provider>,
    { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }
  )

  await waitFor(() =>
    expect(routerMock.asPath.split('?')[0]).toBe('/project/default/functions/send-email/logs')
  )
  const params = new URLSearchParams(routerMock.asPath.split('?')[1])
  expect(params.get('id')).toBe('selected-invocation')
  expect(params.get('filter')).toBe('event_message:ilike:delivery failed')
  expect(params.get('date')).toBe('1774000800000-1774004400000')
})

function FunctionLogNavigation({ isEnabled = true, isLoading = false }) {
  const router = useRouter()
  const state = useFunctionLogsMigration({
    asPath: router.asPath,
    onReplace: router.replace,
    projectRef: 'default',
    functionSlug: 'send-email',
    isEnabled,
    isLoading,
  })
  return <div>{state.shouldUseLegacyLogs ? 'Legacy logs' : 'Unified logs'}</div>
}

it('waits for preview initialization and leaves preview opt-outs on their original bookmark', async () => {
  const bookmark = '/project/default/functions/send-email/logs?log=legacy-log'
  routerMock.setCurrentUrl(bookmark)
  const { rerender } = customRender(<FunctionLogNavigation isLoading />)
  expect(routerMock.asPath).toBe(bookmark)
  rerender(<FunctionLogNavigation isEnabled={false} />)
  expect(routerMock.asPath).toBe(bookmark)
  rerender(<FunctionLogNavigation />)
  await waitFor(() => expect(routerMock.query.id).toBe('legacy-log'))
})

it('migrates a new legacy Logs bookmark during client-side navigation', async () => {
  routerMock.setCurrentUrl('/project/default/functions/send-email/logs')
  customRender(<FunctionLogNavigation />)
  await act(() => routerMock.push('/project/default/functions/send-email/logs?log=first'))
  await waitFor(() => expect(routerMock.query.id).toBe('first'))
  await act(() => routerMock.push('/project/default/functions/send-email/logs?log=second'))
  await waitFor(() => expect(routerMock.query.id).toBe('second'))
})

it('retains the old function log filters when their meaning cannot migrate to unified filters', () => {
  const filter = encodeURIComponent(JSON.stringify({ severity: { error: true } }))
  const bookmark = `/project/default/functions/send-email/logs?f=${filter}`
  routerMock.setCurrentUrl(bookmark)
  customRender(<FunctionLogNavigation />)
  expect(screen.getByText('Legacy logs')).toBeVisible()
  expect(routerMock.asPath).toBe(bookmark)
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
  routerMock.setCurrentUrl('/project/default/functions/send-email')
  const { rerender } = customRender(<FunctionDetailNavigation hasInvocationsTab={false} />)
  await user.keyboard('2')
  expect(routerMock.asPath).toBe('/project/default/functions/send-email')
  await user.keyboard('3')
  expect(routerMock.asPath).toBe('/project/default/functions/send-email/logs')
  rerender(<FunctionDetailNavigation hasInvocationsTab />)
  await user.keyboard('2')
  expect(routerMock.asPath).toBe('/project/default/functions/send-email/invocations')
})

function LegacyFunctionLogsBookmark() {
  const router = useRouter()
  if (router.query.id) return <div>Selected log: {router.query.id}</div>
  return <FunctionLogsPage dehydratedState={undefined} />
}

it('opens a selected log from an old Logs bookmark using the unified time range', async () => {
  const legacy = new URLSearchParams({
    its: '2026-03-20T10:00:00Z',
    ite: '2026-03-20T11:00:00Z',
    log: 'runtime-message',
  })
  routerMock.setCurrentUrl(`/project/default/functions/send-email/logs?${legacy}`)
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
  customRender(
    <FeatureFlagContext.Provider value={featureFlags}>
      <FeaturePreviewContextProvider>
        <LegacyFunctionLogsBookmark />
      </FeaturePreviewContextProvider>
    </FeatureFlagContext.Provider>
  )
  expect(await screen.findByText('Selected log: runtime-message')).toBeVisible()
  expect(routerMock.query.date).toBe('1774000800000-1774004400000')
  expect(routerMock.query.log).toBeUndefined()
})
