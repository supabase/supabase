import { RealtimeInspector } from '.'
import type { PGPublication } from '@supabase/pg-meta'
import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { LogData } from './Messages.types'
import type { RealtimeConfig } from './useRealtimeMessages'
import { databasePublicationsKeys } from '@/data/database-publications/keys'
import type { ProjectDetail } from '@/data/projects/project-detail-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const realtime = vi.hoisted(() => ({ logData: [] as LogData[] }))

vi.mock('./useRealtimeMessages', () => ({
  useRealtimeMessages: () => ({ logData: realtime.logData, sendMessage: vi.fn() }),
}))
vi.mock('./useRealtimeInspectorShortcuts', () => ({ useRealtimeInspectorShortcuts: vi.fn() }))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))
vi.mock('./Header', () => ({
  Header: ({
    config,
    onChangeConfig,
  }: {
    config: RealtimeConfig
    onChangeConfig: (config: RealtimeConfig) => void
  }) => (
    <button
      tabIndex={0}
      onClick={() => onChangeConfig({ ...config, channelName: 'test', enabled: true })}
    >
      Join a channel
    </button>
  ),
}))
vi.mock('./MessagesTable', () => ({ default: () => <div>Inspector messages</div> }))
vi.mock('./EmptyRealtime', () => ({
  EmptyRealtime: () => <button tabIndex={0}>Set up realtime for me</button>,
}))
vi.mock('./SendMessageModal', () => ({ SendMessageModal: () => null }))

const PROJECT: ProjectDetail = {
  cloud_provider: 'AWS',
  connectionString: 'postgresql://postgres@localhost:5432/postgres',
  db_host: 'db.default.supabase.co',
  high_availability: false,
  id: 1,
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_hibernating: false,
  is_physical_backups_enabled: false,
  name: 'Test project',
  organization_id: 1,
  ref: 'default',
  region: 'us-east-1',
  restUrl: 'https://default.supabase.co/rest/v1',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const publication = (
  tables: PGPublication['tables'],
  name = 'supabase_realtime'
): PGPublication => ({
  id: 1,
  name,
  owner: 'postgres',
  publish_insert: true,
  publish_update: true,
  publish_delete: true,
  publish_truncate: true,
  tables,
})

function mockPublications(publications: PGPublication[]) {
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: () => HttpResponse.json<PGPublication[]>(publications),
  })
}

function renderInspector() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  customRender(<RealtimeInspector />, { queryClient })
  return queryClient
}

async function waitForPublications(queryClient: QueryClient, status = 'success') {
  await waitFor(() =>
    expect(queryClient.getQueryState(databasePublicationsKeys.list('default'))?.status).toBe(status)
  )
}

beforeEach(() => {
  realtime.logData = []
  addAPIMock({ method: 'get', path: '/platform/projects/:ref', response: PROJECT })
})

describe('Realtime Inspector setup guidance', () => {
  test.each([
    ['a published table', [publication([{ id: 1, name: 'books', schema: 'public' }])]],
    ['all tables published', [publication(null)]],
  ])('does not show setup guidance with %s and no messages or channel', async (_, publications) => {
    mockPublications(publications)
    await waitForPublications(renderInspector())

    expect(screen.getByText('Inspector messages')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Set up realtime for me' })).not.toBeInTheDocument()
  })

  test.each([
    ['no publications', []],
    ['an empty Realtime publication', [publication([])]],
    ['a different publication', [publication(null, 'other_publication')]],
  ])('retains setup guidance with %s', async (_, publications) => {
    mockPublications(publications)
    renderInspector()

    expect(
      await screen.findByRole('button', { name: 'Set up realtime for me' })
    ).toBeInTheDocument()
    expect(screen.queryByText('Inspector messages')).not.toBeInTheDocument()
  })

  test('does not show setup guidance while publications are loading', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async () => {
        await delay('infinite')
        return HttpResponse.json<PGPublication[]>([])
      },
    })
    const queryClient = renderInspector()
    await waitFor(() =>
      expect(queryClient.getQueryState(databasePublicationsKeys.list('default'))?.fetchStatus).toBe(
        'fetching'
      )
    )

    expect(screen.getByText('Inspector messages')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Set up realtime for me' })).not.toBeInTheDocument()
  })

  test('does not imply Realtime is unconfigured when publications fail to load', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 500 }),
    })
    await waitForPublications(renderInspector(), 'error')

    expect(screen.getByText('Inspector messages')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Set up realtime for me' })).not.toBeInTheDocument()
  })

  test('shows messages immediately after joining a broadcast-only channel', async () => {
    mockPublications([publication([])])
    renderInspector()
    await screen.findByRole('button', { name: 'Set up realtime for me' })

    await userEvent.click(screen.getByRole('button', { name: 'Join a channel' }))

    expect(screen.getByText('Inspector messages')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Set up realtime for me' })).not.toBeInTheDocument()
  })

  test('retains received messages without a channel or published tables', async () => {
    realtime.logData = [{ id: '1', timestamp: 1, message: 'BROADCAST' }]
    mockPublications([])
    await waitForPublications(renderInspector())

    expect(screen.getByText('Inspector messages')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Set up realtime for me' })).not.toBeInTheDocument()
  })
})
