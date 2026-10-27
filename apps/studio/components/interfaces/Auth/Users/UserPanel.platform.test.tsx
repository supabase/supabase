import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeatureFlagContext } from 'common'
import { HttpResponse } from 'msw'
import { createDynamicRouteParser } from 'next-router-mock/dynamic-routes'
import { ResizablePanelGroup } from 'ui'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { UserPanel } from './UserPanel'
import { FeaturePreviewContextProvider } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import type { User } from '@/data/auth/users-infinite-query'
import { miscKeys } from '@/data/misc/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { createMockProfile, createMockProfileContext } from '@/tests/lib/profile-helpers'

const mockUser: User = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'user@example.com',
  providers: ['email'],
}

vi.unmock('common')
const { default: routerMock } =
  await vi.importMock<typeof import('next-router-mock')>('next/router')
const removeRouteParser = routerMock.useParser(
  createDynamicRouteParser(['/project/[ref]/auth/users'])
)
afterAll(removeRouteParser)

vi.mock('./UserOverview', () => ({
  UserOverview: () => <div data-testid="user-overview" />,
}))
vi.mock('./UserLogs', () => ({
  UserLogs: () => <div data-testid="user-logs" />,
}))

const renderPanel = (disabledFeatures: string[] = []) => {
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

  const rendered = customRender(
    <FeatureFlagContext.Provider
      value={{ configcat: { otelUnifiedLogs: false }, posthog: {}, hasLoaded: true }}
    >
      <FeaturePreviewContextProvider>
        <ResizablePanelGroup orientation="horizontal">
          <UserPanel />
        </ResizablePanelGroup>
      </FeaturePreviewContextProvider>
    </FeatureFlagContext.Provider>,
    {
      queryClient,
      nuqs: { searchParams: `?show=${mockUser.id}` },
      profileContext: createMockProfileContext({
        profile: createMockProfile({ disabled_features: disabledFeatures }),
      }),
    }
  )
  return { ...rendered, queryClient }
}

describe('UserPanel', () => {
  beforeEach(() => routerMock.setCurrentUrl('/project/default/auth/users'))

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

  it('identifies the user and copies their complete JSON from the Raw JSON tab', async () => {
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText')
    const { queryClient } = renderPanel()
    expect(await screen.findByText('user@example.com')).toBeInTheDocument()
    expect(screen.getByText('U')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close panel' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Raw JSON' }))
    await user.click(await screen.findByRole('button', { name: 'Copy user as JSON' }))
    expect(copy).toHaveBeenCalledOnce()
    expect(JSON.parse(copy.mock.calls[0][0])).toEqual(mockUser)
    expect(screen.queryByPlaceholderText('Filter...')).not.toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })
})
