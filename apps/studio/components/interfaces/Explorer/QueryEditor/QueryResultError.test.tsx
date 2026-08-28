import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { QueryResultError } from './QueryResultError'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const mocks = vi.hoisted(() => ({
  createChat: vi.fn(),
  useParams: vi.fn(),
  mockCopyToClipboard: vi.fn(),
  useOrgSubscriptionQuery: vi.fn(),
  useProjectSettingsV2Query: vi.fn(),
}))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, useParams: () => mocks.useParams() }
})

// CopyButton and AiAssistantDropdown write via copyToClipboard from 'ui'. Stub just that
// export so we can assert the value handed to the clipboard without depending on jsdom's
// document.hasFocus() / navigator.clipboard. Everything else in 'ui' stays real.
vi.mock('ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ui')>()),
  copyToClipboard: mocks.mockCopyToClipboard,
}))

vi.mock('../hooks', () => ({
  useCreateChat: () => ({ createChat: mocks.createChat, isCreating: false }),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: { slug: 'default-org' } }),
}))

vi.mock('@/data/subscriptions/org-subscription-query', () => ({
  useOrgSubscriptionQuery: () => mocks.useOrgSubscriptionQuery(),
}))

vi.mock('@/data/config/project-settings-v2-query', () => ({
  useProjectSettingsV2Query: () => mocks.useProjectSettingsV2Query(),
}))

describe('QueryResultError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useParams.mockReturnValue({ ref: 'default' })
    mocks.useOrgSubscriptionQuery.mockReturnValue({ data: undefined, isLoading: false })
    mocks.useProjectSettingsV2Query.mockReturnValue({ data: undefined, isLoading: false })
    // useTrack() (invoked by AiAssistantDropdown) reads the selected project to attach
    // telemetry context, so the platform project fetch needs a handler even though this
    // component doesn't read project data itself.
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

  it('opens a new assistant chat seeded with the query and error when debugging', () => {
    customRender(
      <QueryResultError
        error={{ message: 'relation "foo" does not exist' }}
        sql="select * from foo;"
        source="database"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Debug with Assistant' }))

    expect(mocks.createChat).toHaveBeenCalledWith({
      name: 'Debug SQL snippet',
      initialMessage: expect.stringContaining('select * from foo;'),
    })
    expect(mocks.createChat.mock.calls[0][0].initialMessage).toContain(
      'relation "foo" does not exist'
    )
  })

  it('copies the same debug prompt text via the dropdown', async () => {
    const user = userEvent.setup()
    customRender(
      <QueryResultError
        error={{ message: 'relation "foo" does not exist' }}
        sql="select * from foo;"
        source="database"
      />
    )

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(await screen.findByText('Copy prompt'))

    expect(mocks.mockCopyToClipboard).toHaveBeenCalledWith(
      expect.stringContaining('select * from foo;')
    )
  })

  it('does not render the assistant dropdown when the query is unavailable', () => {
    customRender(<QueryResultError error={{ message: 'boom' }} />)

    expect(screen.queryByRole('button', { name: 'Debug with Assistant' })).not.toBeInTheDocument()
  })

  it('does not render the assistant dropdown while HIPAA eligibility is still resolving', () => {
    mocks.useOrgSubscriptionQuery.mockReturnValue({ data: undefined, isLoading: true })

    customRender(
      <QueryResultError
        error={{ message: 'relation "foo" does not exist' }}
        sql="select * from foo;"
        source="database"
      />
    )

    expect(screen.queryByRole('button', { name: 'Debug with Assistant' })).not.toBeInTheDocument()
  })
})
