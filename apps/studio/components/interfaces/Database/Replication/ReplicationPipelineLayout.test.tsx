import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { ReactNode, useRef, type AnchorHTMLAttributes } from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ReplicationPipelineLayout } from './ReplicationPipelineLayout'
import { ReplicationPipelineStatus } from './ReplicationPipelineStatus/ReplicationPipelineStatus'
import type { DestinationWireResponse, PipelineWireResponse } from '@/data/replication/api-types'
import { replicationKeys } from '@/data/replication/keys'
import {
  PipelineRequestStatusProvider,
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

mockAnimationsApi()

const routeParams = vi.hoisted(() => ({ ref: 'default', pipelineId: '42' }))

// The global setup pins useParams to { ref: 'default' }; this layout also needs a pipeline id
vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => routeParams,
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

const renderLayout = (children?: ReactNode, queryClient?: QueryClient) =>
  customRender(
    <PipelineRequestStatusProvider>
      <ReplicationPipelineLayout>{children}</ReplicationPipelineLayout>
    </PipelineRequestStatusProvider>,
    { queryClient }
  )

const TableResetFixture = () => {
  const queryClient = useQueryClient()
  const { runWithRequestStatus } = usePipelineRequestStatus()
  const finishReset = useRef<() => void>(() => {})

  return (
    <>
      <button
        tabIndex={0}
        onClick={() =>
          void runWithRequestStatus(
            '42',
            PipelineStatusRequestStatus.StopRequested,
            () =>
              new Promise<void>((resolve) => {
                finishReset.current = resolve
              })
          )
        }
      >
        Begin table reset
      </button>
      <button
        tabIndex={0}
        onClick={async () => {
          finishReset.current()
          await queryClient.invalidateQueries({
            queryKey: replicationKeys.pipelinesStatus('default', '42'),
          })
        }}
      >
        Finish table reset
      </button>
    </>
  )
}

type PipelineResponse = PipelineWireResponse<components['schemas']['PipelineResponse_Output']>
type PipelineStatusResponse = PipelineWireResponse<
  components['schemas']['PipelineStatusResponse_Output']
>
type PipelineReplicationStatusResponse = PipelineWireResponse<
  components['schemas']['PipelineReplicationStatusResponse_Output']
>
type PipelineVersionResponse = PipelineWireResponse<
  components['schemas']['PipelineVersionResponse_Output']
>
type DestinationResponse = DestinationWireResponse<
  components['schemas']['DestinationResponse_Output']
>
type DestinationsResponse = DestinationWireResponse<
  components['schemas']['DestinationsResponse_Output']
>
type PipelinesResponse = PipelineWireResponse<components['schemas']['PipelinesResponse_Output']>
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
  cluster_id: '1',
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

const mockPipeline = (id: string | number = 42, destination = DESTINATION) => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id',
    response: () => HttpResponse.json<PipelineResponse>({ ...PIPELINE, id }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations/:destination_id',
    response: () => HttpResponse.json<DestinationResponse>(destination),
  })

  // The header renders DestinationPanel so Edit destination can open in place
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations',
    response: () => HttpResponse.json<DestinationsResponse>({ destinations: [destination] }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines',
    response: () => HttpResponse.json<PipelinesResponse>({ pipelines: [{ ...PIPELINE, id }] }),
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

const mockStatus = (name: PipelineStatusResponse['status']['name'], id: string | number = 42) =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
    response: () =>
      HttpResponse.json<PipelineStatusResponse>({ pipeline_id: id, status: { name } }),
  })

const mockVersion = (hasUpdate: boolean, id: string | number = 42) =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/version',
    response: () =>
      HttpResponse.json<PipelineVersionResponse>({
        pipeline_id: id,
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
    routeParams.pipelineId = '42'
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 404 }),
    })
    mockPipeline()
    mockVersion(false)
  })

  test.each(['00150', '03h6pes1npx2ptvf052my5nx2'.repeat(4)])(
    'copies the full pipeline ID %s from the detail header',
    async (pipelineId) => {
      const user = userEvent.setup()
      routeParams.pipelineId = pipelineId
      mockPipeline(pipelineId)
      mockVersion(false, pipelineId)
      mockStatus('stopped', pipelineId)

      renderLayout()

      const copyButton = await screen.findByRole('button', { name: 'Copy pipeline ID' })
      expect(copyButton).toHaveAttribute('title', pipelineId)
      await user.click(copyButton)
      expect(await navigator.clipboard.readText()).toBe(pipelineId)
    }
  )

  test.each(['started', 'stopped', 'failed'] as const)(
    'only allows stopping and deletion for an unknown destination when %s',
    async (status) => {
      mockPipeline('42', { ...DESTINATION, config: { unknown: {} } })
      mockStatus(status, '42')
      mockVersion(true, '42')

      renderLayout(<ReplicationPipelineStatus />)

      expect(await screen.findByRole('img', { name: 'Unknown destination' })).toBeVisible()
      expect(
        screen.queryByRole('button', { name: /^(Start|Restart|Update available)$/ })
      ).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Reset/ })).not.toBeInTheDocument()
      if (status === 'stopped') {
        expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument()
      } else {
        addAPIMock({
          method: 'post',
          path: '/platform/replication/:ref/pipelines/:pipeline_id/stop',
          response: () => {
            mockStatus('stopped', '42')
            return HttpResponse.json<Record<string, never>>({}, { status: 202 })
          },
        })
        await screen.findByText(status === 'started' ? 'Running' : 'Failed')
        expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled()
        await userEvent.click(screen.getByRole('button', { name: 'Stop' }))
        expect(await screen.findByText('Stopped')).toBeVisible()
        expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument()
      }
      await userEvent.click(screen.getByRole('button', { name: 'Pipeline options' }))
      expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
        'Delete pipeline',
      ])
      await userEvent.click(screen.getByRole('menuitem', { name: 'Delete pipeline' }))
      expect(await screen.findByPlaceholderText('Type the pipeline name')).toBeVisible()
    }
  )

  test('blocks direct edit URLs for unknown destinations even with a creation type in the URL', async () => {
    mockPipeline('42', { ...DESTINATION, config: { unknown: {} } })
    mockStatus('stopped', '42')
    mockVersion(false, '42')

    customRender(
      <PipelineRequestStatusProvider>
        <ReplicationPipelineLayout />
      </PipelineRequestStatusProvider>,
      { nuqs: { searchParams: '?edit=7&destinationType=BigQuery' } }
    )

    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Unknown destination')).toBeVisible()
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument()
  })

  test('keeps stopping available without allowing edits when the destination lookup fails', async () => {
    mockPipeline('42')
    mockStatus('started', '42')
    mockVersion(false, '42')
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/destinations/:destination_id',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Destination unavailable' }, { status: 500 }),
    })
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/stop',
      response: () => {
        mockStatus('stopped', '42')
        return HttpResponse.json<Record<string, never>>({}, { status: 202 })
      },
    })

    customRender(
      <PipelineRequestStatusProvider>
        <ReplicationPipelineLayout />
      </PipelineRequestStatusProvider>,
      { nuqs: { searchParams: '?edit=7&destinationType=BigQuery' } }
    )

    await waitFor(() =>
      expect(
        within(screen.getByRole('dialog')).getByText('Failed to retrieve destination information')
      ).toBeVisible()
    )
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(await screen.findByText('Stopped')).toBeVisible()
  })

  test('deletes an unknown pipeline through the existing shutdown and cleanup flow', async () => {
    mockPipeline('42', { ...DESTINATION, config: { unknown: {} } })
    mockStatus('started', '42')
    mockVersion(false, '42')
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/stop',
      response: () => {
        mockStatus('stopping', '42')
        return HttpResponse.json<Record<string, never>>({}, { status: 202 })
      },
    })
    addAPIMock({
      method: 'delete',
      path: '/platform/replication/:ref/destinations-pipelines/:destination_id/:pipeline_id',
      response: () =>
        HttpResponse.json<
          PipelineWireResponse<components['schemas']['DeleteDestinationPipelineResponse_Output']>
        >({
          destination_deleted: true,
          destination_id: 7,
          pipeline_id: '42',
        }),
    })
    const queryClient = new QueryClient()
    renderLayout(undefined, queryClient)
    await screen.findByRole('img', { name: 'Unknown destination' })
    await userEvent.click(screen.getByRole('button', { name: 'Pipeline options' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete pipeline' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByPlaceholderText('Type the pipeline name'))
    await userEvent.paste('Analytics warehouse')
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Delete pipeline' })).toBeEnabled()
    )
    fireEvent.submit(dialog.querySelector('form')!)
    await screen.findByText('Stopping')
    await act(() =>
      queryClient.invalidateQueries({ queryKey: replicationKeys.pipelinesStatus('default', '42') })
    )
    expect(within(dialog).getByRole('button', { name: 'Deleting…' })).toBeDisabled()

    mockStatus('stopped', '42')
    await act(() =>
      queryClient.invalidateQueries({ queryKey: replicationKeys.pipelinesStatus('default', '42') })
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
  test.each([42, '42', '003l8j9rxqi6c8rd5mcx1w2ya'])(
    'renders pipeline %s and stops it using its original ID',
    async (pipelineId) => {
      routeParams.pipelineId = String(pipelineId)
      mockPipeline(pipelineId)
      mockVersion(false, pipelineId)
      mockStatus('started', pipelineId)
      addAPIMock({
        method: 'post',
        path: '/platform/replication/:ref/pipelines/:pipeline_id/stop',
        response: ({ params }) => {
          if (params.pipeline_id !== String(pipelineId)) {
            return HttpResponse.json<APIErrorBody>({ message: 'Unknown pipeline' }, { status: 404 })
          }
          mockStatus('stopped', pipelineId)
          return HttpResponse.json<Record<string, never>>({}, { status: 202 })
        },
      })

      renderLayout()

      expect(await screen.findByRole('heading', { name: 'Analytics warehouse' })).toBeVisible()
      expect(await screen.findByText('Running')).toBeVisible()

      await userEvent.click(screen.getByRole('button', { name: 'Stop' }))
      expect(await screen.findByRole('button', { name: 'Start' })).toBeVisible()
    }
  )

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
    expect(screen.queryByText('Running')).not.toBeInTheDocument()

    resolvePipeline(PIPELINE)

    expect(await screen.findByRole('heading', { name: 'Analytics warehouse' })).toBeVisible()
    expect(await screen.findByText('Running')).toBeVisible()
  })

  test('composes the legacy overview without duplicating the detail header', async () => {
    mockStatus('stopped')
    mockReplicationStatus()

    renderLayout(<ReplicationPipelineStatus />)

    expect(await screen.findByRole('heading', { name: 'Analytics warehouse' })).toBeVisible()
    expect(screen.getAllByRole('link', { name: 'View logs' })).toHaveLength(1)
    expect(await screen.findByRole('heading', { name: 'Pipeline stopped' })).toBeVisible()
  })

  test('explains the state in a tooltip when the dot is hovered', async () => {
    // The dotted underline promises a tooltip; this guards the asChild ref binding that makes it work
    mockStatus('failed')
    renderLayout()

    await userEvent.hover(await screen.findByText('Failed'))

    expect(await screen.findByRole('tooltip')).toBeVisible()
  })

  test('offers the pipeline actions the primary button does not', async () => {
    mockStatus('started')
    renderLayout()

    await screen.findByRole('heading', { name: 'Analytics warehouse' })
    await userEvent.click(screen.getByRole('button', { name: 'Pipeline options' }))

    // Primary button is Stop while running, so the menu carries Restart instead
    expect(await screen.findByRole('menuitem', { name: 'Restart pipeline' })).toBeVisible()
    expect(screen.queryByRole('menuitem', { name: 'Stop pipeline' })).not.toBeInTheDocument()
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
    await userEvent.click(updateButton)
    // The trigger button shares this name, so match the dialog's heading specifically
    expect(await screen.findByRole('heading', { name: 'Update available' })).toBeVisible()
  })
})
