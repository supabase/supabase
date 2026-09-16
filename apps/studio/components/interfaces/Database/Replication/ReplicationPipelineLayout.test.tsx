import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { ReactNode, type AnchorHTMLAttributes } from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ReplicationPipelineLayout } from './ReplicationPipelineLayout'
import { ReplicationPipelineStatus } from './ReplicationPipelineStatus/ReplicationPipelineStatus'
import {
  PipelineRequestStatusProvider,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

// The global setup pins useParams to { ref: 'default' }; this layout also needs a pipeline id
vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'default', pipelineId: '42' }),
}))

vi.mock('next/router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const renderLayout = (children?: ReactNode) =>
  customRender(
    <PipelineRequestStatusProvider>
      <ReplicationPipelineLayout>{children}</ReplicationPipelineLayout>
    </PipelineRequestStatusProvider>
  )

const TableResetFixture = () => {
  const { setTableResetting } = usePipelineRequestStatus()

  return (
    <>
      <button tabIndex={0} onClick={() => setTableResetting(42, true)}>
        Begin table reset
      </button>
      <button tabIndex={0} onClick={() => setTableResetting(42, false)}>
        Finish table reset
      </button>
    </>
  )
}

type PipelineResponse = components['schemas']['PipelineResponse_Output']
type PipelineStatusResponse = components['schemas']['PipelineStatusResponse_Output']
type PipelineReplicationStatusResponse =
  components['schemas']['PipelineReplicationStatusResponse_Output']
type PipelineVersionResponse = components['schemas']['PipelineVersionResponse_Output']
type DestinationResponse = components['schemas']['DestinationResponse_Output']
type DestinationsResponse = components['schemas']['DestinationsResponse_Output']
type PipelinesResponse = components['schemas']['PipelinesResponse_Output']
type SourcesResponse = components['schemas']['SourcesResponse_Output']

const PIPELINE: PipelineResponse = {
  id: 42,
  config: { publication_name: 'analytics_publication' },
  destination_id: 7,
  destination_name: 'Analytics warehouse',
  replicator_id: 1,
  source_id: 2,
  source_name: 'main-db',
  tenant_id: 'default',
}

const DESTINATION: DestinationResponse = {
  id: 7,
  name: 'Analytics warehouse',
  tenant_id: 'default',
  config: {
    big_query: {
      connection_pool_size: 8,
      dataset_id: 'analytics',
      project_id: 'acme-analytics',
    },
  },
}

const mockPipeline = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id',
    response: () => HttpResponse.json<PipelineResponse>(PIPELINE),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations/:destination_id',
    response: () => HttpResponse.json<DestinationResponse>(DESTINATION),
  })

  // The header renders DestinationPanel so Edit destination can open in place
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations',
    response: () => HttpResponse.json<DestinationsResponse>({ destinations: [DESTINATION] }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines',
    response: () => HttpResponse.json<PipelinesResponse>({ pipelines: [PIPELINE] }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () =>
      HttpResponse.json<SourcesResponse>({
        sources: [
          {
            tenant_id: 'default',
            id: 2,
            name: 'default',
            config: { host: 'db.internal', port: 5432, name: 'main-db', username: 'etl_user' },
          },
        ],
      }),
  })
}

const mockStatus = (name: PipelineStatusResponse['status']['name']) =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
    response: () =>
      HttpResponse.json<PipelineStatusResponse>({ pipeline_id: 42, status: { name } }),
  })

const mockVersion = (hasUpdate: boolean) =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/version',
    response: () =>
      HttpResponse.json<PipelineVersionResponse>({
        pipeline_id: 42,
        version: { id: 1, name: 'v0.2.0' },
        ...(hasUpdate ? { new_version: { id: 2, name: 'v0.3.0' } } : {}),
      }),
  })

const mockReplicationStatus = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/replication-status',
    response: () =>
      HttpResponse.json<PipelineReplicationStatusResponse>({
        pipeline_id: 42,
        table_statuses: [],
      }),
  })

describe('ReplicationPipelineLayout', () => {
  beforeEach(() => {
    mockPipeline()
    mockVersion(false)
  })

  test('renders pipeline identity, chrome actions and the lifecycle action', async () => {
    mockStatus('started')

    renderLayout(<div>Overview content</div>)

    expect(await screen.findByRole('heading', { name: 'Analytics warehouse' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Replication' })).toHaveAttribute(
      'href',
      '/project/default/database/replication'
    )
    expect(screen.getByRole('link', { name: 'View logs' }).getAttribute('href')).toContain(
      'pipeline_id'
    )
    expect(screen.getByText('Running')).toBeVisible()
    expect(screen.getByText('Primary database')).toBeVisible()
    expect(await screen.findByText('BigQuery')).toBeVisible()
    expect(await screen.findByRole('button', { name: 'Stop' })).toBeVisible()
    expect(screen.getByText('Overview content')).toBeVisible()
  })

  test('keeps the pipeline identity structure in place while it loads', async () => {
    let resolvePipeline: (pipeline: PipelineResponse) => void = () => {}
    const pipelineResponse = new Promise<PipelineResponse>((resolve) => {
      resolvePipeline = resolve
    })

    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id',
      response: async () => HttpResponse.json<PipelineResponse>(await pipelineResponse),
    })
    mockStatus('started')

    renderLayout()

    expect(screen.getByText('Primary database')).toBeVisible()
    expect(screen.getByText('Loading destination')).toBeInTheDocument()
    expect(screen.getAllByText('Loading pipeline')).toHaveLength(2)
    expect(screen.queryByText('Running')).not.toBeInTheDocument()

    resolvePipeline(PIPELINE)

    expect(await screen.findByRole('heading', { name: 'Analytics warehouse' })).toBeVisible()
    expect(await screen.findByText('BigQuery')).toBeVisible()
    expect(await screen.findByText('Running')).toBeVisible()
  })

  test('composes the legacy overview without duplicating the detail header', async () => {
    mockStatus('stopped')
    mockReplicationStatus()

    renderLayout(<ReplicationPipelineStatus />)

    expect(await screen.findByRole('heading', { name: 'Analytics warehouse' })).toBeVisible()
    expect(screen.getAllByRole('link', { name: 'View logs' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Start' })).toHaveLength(1)
    expect(await screen.findByRole('heading', { name: 'Pipeline stopped' })).toBeVisible()
  })

  test('explains the state in a tooltip when the dot is hovered', async () => {
    // The dotted underline promises a tooltip; this guards the asChild ref binding that makes it work
    mockStatus('failed')
    renderLayout()

    await userEvent.hover(await screen.findByText('Failed'))

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Replication has encountered an error. Check the logs for more information.'
    )
    expect(screen.queryByRole('link', { name: 'logs' })).not.toBeInTheDocument()
  })

  test('offers the pipeline actions the primary button does not', async () => {
    mockStatus('started')
    renderLayout()

    await screen.findByRole('heading', { name: 'Analytics warehouse' })
    await userEvent.click(screen.getByRole('button', { name: 'Pipeline options' }))

    // Primary button is Stop while running, so the menu carries Restart instead
    expect(await screen.findByRole('menuitem', { name: 'Restart pipeline' })).toBeVisible()
    expect(screen.queryByRole('menuitem', { name: 'Stop pipeline' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Edit pipeline' })).toBeVisible()
    expect(screen.getByRole('menuitem', { name: 'Delete pipeline' })).toBeVisible()
  })

  test('blocks pipeline actions while a table reset is running', async () => {
    mockStatus('started')
    mockVersion(true)
    renderLayout(<TableResetFixture />)

    const lifecycleAction = await screen.findByRole('button', { name: 'Stop' })
    const options = screen.getByRole('button', { name: 'Pipeline options' })
    const update = await screen.findByRole('button', { name: 'Update available' })
    expect(lifecycleAction).toBeEnabled()
    expect(options).toBeEnabled()
    expect(update).toBeEnabled()

    await userEvent.click(screen.getByRole('button', { name: 'Begin table reset' }))
    expect(lifecycleAction).toBeDisabled()
    expect(options).toBeDisabled()
    expect(update).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Finish table reset' }))
    expect(lifecycleAction).toBeEnabled()
    expect(options).toBeEnabled()
    expect(update).toBeEnabled()
  })

  test('offers Stop from the menu when the primary button is Restart', async () => {
    mockStatus('failed')
    renderLayout()

    await screen.findByRole('heading', { name: 'Analytics warehouse' })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Restart' })).toBeEnabled())
    await userEvent.click(screen.getByRole('button', { name: 'Pipeline options' }))

    expect(await screen.findByRole('menuitem', { name: 'Stop pipeline' })).toBeVisible()
    expect(screen.queryByRole('menuitem', { name: 'Restart pipeline' })).not.toBeInTheDocument()
  })

  test('keeps an available update visible and opens its modal', async () => {
    mockStatus('started')
    mockVersion(true)

    renderLayout()

    const updateButton = await screen.findByRole('button', { name: 'Update available' })
    expect(updateButton).toHaveClass('bg-brand-400')
    await userEvent.click(updateButton)
    // The trigger button shares this name, so match the dialog's heading specifically
    expect(await screen.findByRole('heading', { name: 'Update available' })).toBeVisible()
  })
})
