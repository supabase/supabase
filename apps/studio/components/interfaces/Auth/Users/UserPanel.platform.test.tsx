import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { platformComponents } from 'api-types'
import { FeatureFlagContext, LOCAL_STORAGE_KEYS } from 'common'
import { HttpResponse } from 'msw'
import { createDynamicRouteParser } from 'next-router-mock/dynamic-routes'
import { ResizablePanelGroup } from 'ui'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { UserPanel } from './UserPanel'
import { FeaturePreviewContextProvider } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import type { User } from '@/data/auth/users-infinite-query'
import { miscKeys } from '@/data/misc/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { mockPermissions } from '@/tests/lib/msw-permissions'
import { NO_PERMISSIONS } from '@/tests/lib/permissions-fixtures'
import { createMockProfile, createMockProfileContext } from '@/tests/lib/profile-helpers'

const mockUser: User = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'user@example.com',
  providers: ['email'],
  created_at: '2026-01-01T12:00:00Z',
  raw_user_meta_data: { locale: 'en', preferences: { theme: 'dark' } },
  raw_app_meta_data: { providers: ['email'] },
}

vi.unmock('common')
const { default: routerMock } =
  await vi.importMock<typeof import('next-router-mock')>('next/router')
const removeRouteParser = routerMock.useParser(
  createDynamicRouteParser(['/project/[ref]/auth/users'])
)
afterAll(removeRouteParser)

vi.mock('./UserLogs', () => ({
  UserLogs: () => <div data-testid="user-logs" />,
}))

const renderPanel = (
  disabledFeatures: string[] = [],
  { otel = false, unifiedLogs = false }: { otel?: boolean | null; unifiedLogs?: boolean } = {}
) => {
  localStorage.setItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS, JSON.stringify(unifiedLogs))
  mockPermissions(NO_PERMISSIONS)
  addAPIMock({
    method: 'get',
    path: '/platform/auth/:ref/config',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 403 }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: {
      cloud_provider: 'AWS',
      db_host: 'db.default.supabase.co',
      high_availability: false,
      id: 1,
      inserted_at: '2026-01-01T00:00:00Z',
      integration_source: null,
      is_branch_enabled: false,
      is_physical_backups_enabled: false,
      name: 'Test project',
      organization_id: 1,
      ref: 'default',
      region: 'us-east-1',
      restUrl: 'https://default.supabase.co',
      status: 'ACTIVE_HEALTHY',
      subscription_id: 'subscription-1',
      updated_at: '2026-01-01T00:00:00Z',
      connectionString: 'postgresql://postgres:password@localhost:5432/postgres',
    },
  })
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: () => HttpResponse.json<User[]>([mockUser]),
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(miscKeys.enabledFeaturesOverride(), { disabled_features: [] })

  const content = (backend = otel) => (
    <FeatureFlagContext.Provider
      value={{
        configcat: backend === null ? {} : { otelUnifiedLogs: backend },
        posthog: {},
        hasLoaded: true,
      }}
    >
      <FeaturePreviewContextProvider>
        <ResizablePanelGroup orientation="horizontal">
          <UserPanel />
        </ResizablePanelGroup>
      </FeaturePreviewContextProvider>
    </FeatureFlagContext.Provider>
  )
  const rendered = customRender(content(), {
    queryClient,
    nuqs: { searchParams: `?show=${mockUser.id}` },
    profileContext: createMockProfileContext({
      profile: createMockProfile({ disabled_features: disabledFeatures }),
    }),
  })
  return {
    ...rendered,
    queryClient,
    updateBackend: (backend: boolean) => rendered.rerender(content(backend)),
  }
}

describe('UserPanel', () => {
  beforeEach(() => routerMock.setCurrentUrl('/project/default/auth/users'))
  afterEach(() => localStorage.removeItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS))

  it('shows the legacy Logs tab when logs are enabled', async () => {
    const { queryClient } = renderPanel()
    expect(await screen.findByRole('tab', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Logs' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Raw JSON' })).toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })

  it('hides the legacy Logs tab when logs are disabled', async () => {
    const { queryClient } = renderPanel(['logs:all'])
    expect(await screen.findByRole('tab', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Logs' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Raw JSON' })).toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })

  it('copies overview fields and complete raw JSON from the selected user', async () => {
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText')
    const { queryClient } = renderPanel()
    expect(
      await screen.findByRole('button', { name: 'Email user@example.com' })
    ).toBeInTheDocument()
    const emailField = screen.getByRole('button', { name: 'Email user@example.com' })
    emailField.focus()
    await user.keyboard('{Enter}')
    await user.click(await screen.findByRole('menuitem', { name: 'Copy Email' }))
    expect(copy).toHaveBeenLastCalledWith(mockUser.email)
    expect(screen.getByText('U')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close panel' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Raw JSON' }))
    await user.click(await screen.findByRole('button', { name: 'Copy user as JSON' }))
    expect(copy).toHaveBeenCalledTimes(2)
    expect(JSON.parse(copy.mock.calls[1][0])).toEqual(mockUser)
    expect(screen.queryByPlaceholderText('Filter...')).not.toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })
  it.each([true, null])(
    'shows recent user logs after Raw JSON with backend flag %s',
    async (otel) => {
      const user = userEvent.setup()
      addAPIMock({
        method: 'post',
        path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
        response: () =>
          HttpResponse.json<platformComponents['schemas']['AnalyticsResponse_Output']>({
            result: [],
          }),
      })
      const { queryClient } = renderPanel([], { otel, unifiedLogs: true })
      await screen.findByRole('tab', { name: 'Logs' })
      expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
        'Overview',
        'Raw JSON',
        'Logs',
      ])
      await user.click(screen.getByRole('tab', { name: 'Logs' }))
      expect(await screen.findByText('No logs in the last 24 hours')).toBeVisible()
      expect(screen.queryByRole('link', { name: 'View logs' })).not.toBeInTheDocument()
      await waitFor(() => expect(queryClient.isFetching()).toBe(0))
    }
  )
  it('keeps Logs selected when switching between legacy and unified logs', async () => {
    const user = userEvent.setup()
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: () =>
        HttpResponse.json<platformComponents['schemas']['AnalyticsResponse_Output']>({
          result: [],
        }),
    })
    const { updateBackend, queryClient } = renderPanel([], { otel: false, unifiedLogs: true })
    await user.click(await screen.findByRole('tab', { name: 'Logs' }))
    expect(await screen.findByTestId('user-logs')).toBeVisible()
    updateBackend(true)
    expect(await screen.findByText('No logs in the last 24 hours')).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Logs' })).toHaveAttribute('aria-selected', 'true')
    updateBackend(false)
    expect(await screen.findByTestId('user-logs')).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Logs' })).toHaveAttribute('aria-selected', 'true')
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })
})
