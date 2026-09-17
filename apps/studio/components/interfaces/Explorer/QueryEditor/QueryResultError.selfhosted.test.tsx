import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { QueryResultError } from './QueryResultError'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const mocks = vi.hoisted(() => ({
  createChat: vi.fn(),
  useParams: vi.fn(),
}))

vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/constants')
  return { ...actual, IS_PLATFORM: false }
})

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, useParams: () => mocks.useParams() }
})

vi.mock('../hooks', () => ({
  useCreateChat: () => ({ createChat: mocks.createChat, isCreating: false }),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: undefined }),
}))

// Self-hosted has no orgs/billing, so these eligibility queries are expected to never
// resolve (disabled or failing) - the dropdown must not stay hidden waiting on them.
vi.mock('@/data/subscriptions/org-subscription-query', () => ({
  useOrgSubscriptionQuery: () => ({ data: undefined, isSuccess: false }),
}))

vi.mock('@/data/config/project-settings-v2-query', () => ({
  useProjectSettingsV2Query: () => ({ data: undefined, isSuccess: false }),
}))

describe('QueryResultError (self-hosted)', () => {
  beforeEach(() => {
    mocks.useParams.mockReturnValue({ ref: 'default' })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: {
        id: 1,
        ref: 'default',
        organization_id: 1,
        name: 'Test Project',
        status: 'ACTIVE_HEALTHY',
        cloud_provider: 'AWS',
        region: 'us-east-1',
        db_host: 'db.default.supabase.co',
        restUrl: 'https://default.supabase.co/rest/v1/',
        inserted_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        subscription_id: 'sub_123',
        is_branch_enabled: false,
        is_physical_backups_enabled: false,
        high_availability: false,
        integration_source: null,
        connectionString: 'postgresql://postgres@localhost:5432/postgres',
        is_hibernating: false,
      },
    })
  })

  it('renders the assistant dropdown without waiting on HIPAA eligibility queries', () => {
    customRender(
      <QueryResultError
        error={{ message: 'relation "foo" does not exist' }}
        sql="select * from foo;"
        source="database"
      />
    )

    expect(screen.getByRole('button', { name: 'Debug with Assistant' })).toBeInTheDocument()
  })
})
