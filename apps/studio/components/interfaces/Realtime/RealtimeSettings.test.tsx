import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { z } from 'zod'

import { RealtimeSettings } from './RealtimeSettings'
import type { Entitlement, FeatureKey } from '@/data/entitlements/entitlements-query'
import type { RealtimeConfiguration } from '@/data/realtime/realtime-config-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

const {
  mockUseAsyncCheckPermissions,
  mockUseMaxConnectionsQuery,
  mockUseSelectedOrganizationQuery,
  mockUseSelectedProjectQuery,
  mockUseDatabasePoliciesQuery,
} = vi.hoisted(() => ({
  mockUseAsyncCheckPermissions: vi.fn(),
  mockUseMaxConnectionsQuery: vi.fn(),
  mockUseSelectedOrganizationQuery: vi.fn(),
  mockUseSelectedProjectQuery: vi.fn(),
  mockUseDatabasePoliciesQuery: vi.fn(),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: mockUseAsyncCheckPermissions,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: mockUseSelectedProjectQuery,
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: mockUseSelectedOrganizationQuery,
}))

vi.mock('@/data/database/max-connections-query', () => ({
  useMaxConnectionsQuery: mockUseMaxConnectionsQuery,
}))

vi.mock('@/data/database-policies/database-policies-query', () => ({
  useDatabasePoliciesQuery: mockUseDatabasePoliciesQuery,
}))

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, IS_PLATFORM: true }
})

const REALTIME_CONFIG: RealtimeConfiguration = {
  connection_pool: 2,
  postgres_changes_pool: 2,
  max_bytes_per_second: 100000,
  max_channels_per_client: 100,
  max_concurrent_users: 200,
  max_events_per_second: 100,
  max_joins_per_second: 100,
  max_payload_size_in_kb: 100,
  max_presence_events_per_second: 100,
  presence_enabled: true,
  private_only: false,
  suspend: false,
}

const REALTIME_ENTITLEMENTS: Entitlement[] = (
  [
    ['realtime.max_concurrent_users', 50_000],
    ['realtime.max_events_per_second', 50_000],
    ['realtime.max_presence_events_per_second', 5_000],
    ['realtime.max_payload_size_in_kb', 3_000],
  ] satisfies [FeatureKey, number][]
).map(([key, value]) => ({
  config: { enabled: true, unit: '', unlimited: false, value },
  feature: { key, type: 'numeric' },
  hasAccess: true,
  type: 'numeric',
}))

describe('RealtimeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseAsyncCheckPermissions.mockReturnValue({ can: true, isSuccess: true })
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { ref: 'default', connectionString: 'postgresql://example' },
    })
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: { slug: 'default', plan: { id: 'pro' }, usage_billing_enabled: true },
      isSuccess: true,
    })
    mockUseMaxConnectionsQuery.mockReturnValue({ data: { maxConnections: 20 } })
    mockUseDatabasePoliciesQuery.mockReturnValue({ data: [], isSuccess: true })

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/config/realtime',
      response: () => HttpResponse.json<RealtimeConfiguration>(REALTIME_CONFIG),
    })

    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/entitlements',
      response: { entitlements: REALTIME_ENTITLEMENTS },
    })
  })

  test('renders the fetched postgres changes pool value', async () => {
    customRender(<RealtimeSettings />)

    expect(await screen.findByLabelText('Postgres Changes connection pool size')).toHaveValue(2)
  })

  test('submits the postgres changes pool value when saving', async () => {
    const updateBodySchema = z.object({ postgres_changes_pool: z.number() })

    const requests: z.infer<typeof updateBodySchema>[] = []
    addAPIMock({
      method: 'patch',
      path: '/platform/projects/:ref/config/realtime',
      response: async ({ request }) => {
        requests.push(updateBodySchema.parse(await request.json()))
        return new HttpResponse(null, { status: 204 })
      },
    })

    customRender(<RealtimeSettings />)

    const postgresChangesPoolInput = await screen.findByLabelText(
      'Postgres Changes connection pool size'
    )
    await userEvent.clear(postgresChangesPoolInput)
    await userEvent.type(postgresChangesPoolInput, '5')

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]).toMatchObject({ postgres_changes_pool: 5 })
  })
})
