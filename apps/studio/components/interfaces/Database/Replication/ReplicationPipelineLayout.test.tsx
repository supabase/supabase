import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ReplicationPipelineLayout } from './ReplicationPipelineLayout'
import { customRender } from '@/tests/lib/custom-render'

const mocks = vi.hoisted(() => ({
  status: 'started',
  hasUpdate: false,
  path: '/project/default/database/replication/42',
  setRequestStatus: vi.fn(),
}))

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'default', pipelineId: '42' }),
}))

vi.mock('next/router', () => ({
  useRouter: () => ({ asPath: mocks.path }),
}))

vi.mock('./PipelineStatus', () => ({
  PipelineStatus: () => <span>Running</span>,
}))

vi.mock('./UpdateVersionModal', () => ({
  UpdateVersionModal: ({ visible }: { visible: boolean }) =>
    visible ? <div>Update pipeline version</div> : null,
}))

vi.mock('@/data/replication/pipeline-by-id-query', () => ({
  useReplicationPipelineByIdQuery: () => ({
    data: {
      id: 42,
      source_name: 'main-db',
      destination_name: 'Analytics warehouse',
      config: { publication_name: 'analytics_publication' },
    },
    error: null,
  }),
}))

vi.mock('@/data/replication/pipeline-status-query', () => ({
  useReplicationPipelineStatusQuery: () => ({
    data: { status: { name: mocks.status } },
    isLoading: false,
    isError: false,
    isSuccess: true,
  }),
}))

vi.mock('@/data/replication/pipeline-version-query', () => ({
  useReplicationPipelineVersionQuery: () => ({
    data: mocks.hasUpdate ? { new_version: { id: 2 } } : undefined,
  }),
}))

vi.mock('@/data/replication/start-pipeline-mutation', () => ({
  useStartPipelineMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/data/replication/stop-pipeline-mutation', () => ({
  useStopPipelineMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/data/replication/restart-pipeline-mutation', () => ({
  useRestartPipelineMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/state/replication-pipeline-request-status', () => ({
  PipelineStatusRequestStatus: {
    None: 'None',
    StartRequested: 'StartRequested',
    StopRequested: 'StopRequested',
    RestartRequested: 'RestartRequested',
  },
  usePipelineRequestStatus: () => ({
    getRequestStatus: () => 'None',
    setRequestStatus: mocks.setRequestStatus,
    updatePipelineStatus: vi.fn(),
  }),
}))

describe('ReplicationPipelineLayout', () => {
  beforeEach(() => {
    mocks.status = 'started'
    mocks.hasUpdate = false
    mocks.path = '/project/default/database/replication/42'
  })

  test('renders pipeline identity, navigation, logs and lifecycle action', async () => {
    customRender(
      <ReplicationPipelineLayout>
        <div>Overview content</div>
      </ReplicationPipelineLayout>
    )

    expect(await screen.findByRole('heading', { name: 'Analytics warehouse' })).toBeVisible()
    expect(screen.getByText('From main-db using analytics_publication')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Replication' })).toHaveAttribute(
      'href',
      '/project/default/database/replication'
    )
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/project/default/database/replication/42/settings'
    )
    expect(screen.getByRole('link', { name: 'View logs' }).getAttribute('href')).toContain(
      'pipeline_id'
    )
    expect(screen.getByRole('button', { name: 'Stop' })).toBeVisible()
  })

  test('keeps an available update visible and opens its modal', async () => {
    mocks.hasUpdate = true
    customRender(<ReplicationPipelineLayout />)

    const updateButton = await screen.findByRole('button', { name: 'Update available' })
    expect(updateButton).toHaveClass('bg-brand-400')
    fireEvent.click(updateButton)
    expect(screen.getByText('Update pipeline version')).toBeVisible()
  })

  test.each([
    ['stopped', 'Start'],
    ['failed', 'Restart'],
  ])('shows the correct %s lifecycle action', async (status, action) => {
    mocks.status = status
    customRender(<ReplicationPipelineLayout />)

    expect(await screen.findByRole('button', { name: action })).toBeVisible()
  })

  test('marks Settings active on the settings route', async () => {
    mocks.path = '/project/default/database/replication/42/settings?edit=7'
    customRender(<ReplicationPipelineLayout />)

    expect((await screen.findByRole('link', { name: 'Settings' })).parentElement).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })
})
