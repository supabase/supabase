import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { RealtimeSettings } from './RealtimeSettings'
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

const REALTIME_CONFIG: components['schemas']['RealtimeConfigResponse'] = {
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

describe('RealtimeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseAsyncCheckPermissions.mockReturnValue({ can: true, isSuccess: true })
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { ref: 'default', connectionString: 'postgresql://example' },
    })
    mockUseSelectedOrganizationQuery.mockReturnValue({ data: undefined, isSuccess: false })
    mockUseMaxConnectionsQuery.mockReturnValue({ data: { maxConnections: 20 } })
    mockUseDatabasePoliciesQuery.mockReturnValue({ data: [], isSuccess: true })

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/config/realtime',
      response: () =>
        HttpResponse.json<components['schemas']['RealtimeConfigResponse']>(REALTIME_CONFIG),
    })
  })

  test('renders the fetched pool value and warns when the combined pool size exceeds 50% of max connections', async () => {
    customRender(<RealtimeSettings />)

    const postgresChangesPoolInput = await screen.findByLabelText(
      'Postgres Changes connection pool size'
    )
    expect(postgresChangesPoolInput).toHaveValue(2)
    expect(
      screen.queryByText(/Both pools combined are greater than 50% of the max connections/)
    ).not.toBeInTheDocument()

    await userEvent.clear(postgresChangesPoolInput)
    await userEvent.type(postgresChangesPoolInput, '8')

    expect(
      screen.queryByText(/Both pools combined are greater than 50% of the max connections/)
    ).not.toBeInTheDocument()

    await userEvent.clear(postgresChangesPoolInput)
    await userEvent.type(postgresChangesPoolInput, '9')

    expect(
      await screen.findByText(/Both pools combined are greater than 50% of the max connections/)
    ).toBeInTheDocument()
    expect(screen.getByText(/Realtime opens 11 connections across both pools/)).toBeInTheDocument()
  })

  test('submits the postgres changes pool value when saving', async () => {
    const requests: components['schemas']['UpdateRealtimeConfigBody'][] = []
    addAPIMock({
      method: 'patch',
      path: '/platform/projects/:ref/config/realtime',
      response: async ({ request }) => {
        requests.push((await request.json()) as components['schemas']['UpdateRealtimeConfigBody'])
        return HttpResponse.json({}, { status: 204 })
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
