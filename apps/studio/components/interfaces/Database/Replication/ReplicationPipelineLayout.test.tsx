import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { ReactNode } from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ReplicationPipelineLayout } from './ReplicationPipelineLayout'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

// The global setup pins useParams to { ref: 'default' }; this layout also needs a pipeline id
vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'default', pipelineId: '42' }),
}))

const renderLayout = (children?: ReactNode) =>
  customRender(
    <PipelineRequestStatusProvider>
      <ReplicationPipelineLayout>{children}</ReplicationPipelineLayout>
    </PipelineRequestStatusProvider>
  )

type PipelineResponse = components['schemas']['ReplicationPipelineResponse']
type PipelineStatusResponse = components['schemas']['ReplicationPipelineStatusResponse']
type PipelineVersionResponse = components['schemas']['ReplicationPipelineVersionResponse']
type DestinationResponse = components['schemas']['ReplicationDestinationResponse']
type DestinationsResponse = components['schemas']['ReplicationDestinationsResponse']
type PipelinesResponse = components['schemas']['ReplicationPipelinesResponse']
type SourcesResponse = components['schemas']['ReplicationSourcesResponse']

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
    expect(await screen.findByRole('button', { name: 'Stop' })).toBeVisible()
    expect(screen.getByText('Overview content')).toBeVisible()
  })

  test('renders Overview as the only navigation tab', async () => {
    mockStatus('started')
    renderLayout()

    await screen.findByRole('heading', { name: 'Analytics warehouse' })
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'href',
      '/project/default/database/replication/42'
    )
    expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument()
  })

  test('shows the pipeline state as a labelled dot', async () => {
    mockStatus('stopped')
    renderLayout()

    expect(await screen.findByText('Stopped')).toBeVisible()
  })

  test('shows where the pipeline sends data', async () => {
    mockStatus('started')
    renderLayout()

    expect(await screen.findByText('BigQuery')).toBeVisible()
    expect(screen.getByText('Primary database')).toBeVisible()
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
    expect(await screen.findByText('Update pipeline image')).toBeVisible()
  })

  test.each([
    ['stopped', 'Start'],
    ['failed', 'Restart'],
  ] as const)('shows the correct %s lifecycle action', async (status, action) => {
    mockStatus(status)
    renderLayout()

    await waitFor(() => expect(screen.getByRole('button', { name: action })).toBeEnabled())
  })
})
