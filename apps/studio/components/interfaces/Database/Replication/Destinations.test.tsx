import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { http, HttpResponse } from 'msw'
import { useQueryState } from 'nuqs'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { Destinations } from './Destinations'
import { replicationKeys } from '@/data/replication/keys'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer, type APIErrorBody } from '@/tests/lib/msw'

mockAnimationsApi()
const options = vi.hoisted(() => ({
  wizard: false,
  previewLoading: false,
  flagsLoaded: true,
  tanStack: false,
  navigate: vi.fn(),
  push: vi.fn(),
  bigQueryEnabled: true,
  hasAccess: true,
  isLoading: false,
  failEnable: false,
  failRefresh: false,
}))
vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))
vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'default' }),
  useFeatureFlags: () => ({ hasLoaded: options.flagsLoaded }),
}))
vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useRouter: () => (options.tanStack ? { navigate: options.navigate } : undefined),
}))
vi.mock('next/compat/router', () => ({
  useRouter: () => ({ push: options.push, events: { on: vi.fn(), off: vi.fn() } }),
}))
vi.mock('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  usePipelineCreationPreview: () => ({
    isEnabled: options.wizard,
    isLoading: options.previewLoading,
  }),
}))
vi.mock('./useIsPipelinesEnabled', () => ({
  useIsPipelinesBigQueryEnabled: () => options.bigQueryEnabled,
  useIsPipelinesDuckLakeEnabled: () => false,
  useIsPipelinesSnowflakeEnabled: () => false,
  useIsPipelinesClickHouseEnabled: () => false,
}))
vi.mock('@/hooks/misc/useCheckEntitlements', () => ({
  useCheckEntitlements: () => ({ hasAccess: options.hasAccess, isLoading: options.isLoading }),
}))
vi.mock('./DestinationPanel/DestinationPanel', () => ({
  DestinationPanel: () => {
    const [type] = useQueryState('destinationType')
    return type ? <h2>Creation sheet: {type}</h2> : null
  },
}))
const SINGAPORE = { cluster_id: '1', region_code: 'ap-southeast-1', region_name: 'Singapore' }
const FRANKFURT = { cluster_id: '2', region_code: 'eu-central-1', region_name: 'Frankfurt' }
let isEnabled = false
let enableGate: Promise<void> | undefined
beforeEach(() => {
  options.wizard = false
  options.previewLoading = false
  options.flagsLoaded = true
  options.tanStack = false
  options.navigate.mockClear()
  options.push.mockClear()
  isEnabled = false
  enableGate = undefined
  options.bigQueryEnabled = true
  options.hasAccess = true
  options.isLoading = false
  options.failRefresh = false
  options.failEnable = false
  mswServer.use(
    http.get('http://localhost:3000/api/enabled-features-overrides', () =>
      HttpResponse.json<{ disabled_features: string[] }>({ disabled_features: [] })
    )
  )
  addAPIMock({
    method: 'get',
    path: '/platform/replication/regions',
    response: () =>
      HttpResponse.json<components['schemas']['PipelineRegionsResponse_Output']>({
        default_cluster_id: '1',
        regions: [SINGAPORE],
      }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 404 }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations',
    response: () =>
      HttpResponse.json<components['schemas']['DestinationsResponse_Output']>({ destinations: [] }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines',
    response: () =>
      HttpResponse.json<components['schemas']['PipelinesResponse_Output']>({ pipelines: [] }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () =>
      options.failRefresh && isEnabled
        ? HttpResponse.json<APIErrorBody>(
            { message: 'replication API URL is not configured' },
            { status: 503 }
          )
        : HttpResponse.json<components['schemas']['SourcesResponse_Output']>({
            sources: isEnabled
              ? [
                  {
                    id: 42,
                    name: 'default',
                    tenant_id: 'tenant',
                    config: {
                      host: 'localhost',
                      port: 5432,
                      name: 'postgres',
                      username: 'postgres',
                    },
                  },
                ]
              : [],
          }),
  })
  addAPIMock({
    method: 'post',
    path: '/platform/replication/:ref/tenants-sources',
    response: async () => {
      await enableGate
      if (options.failEnable) {
        options.failEnable = false
        return HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 503 })
      }
      isEnabled = true
      return HttpResponse.json<components['schemas']['CreateTenantSourceResponse_Output']>({
        source_id: 42,
        tenant_id: 'tenant',
      })
    },
  })
})
const renderList = async (waitForSources = true) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = customRender(<Destinations />, { queryClient, nuqs: { hasMemory: true } })
  await screen.findByRole('heading', { name: 'Add a pipeline' })
  if (waitForSources)
    await waitFor(() =>
      expect(queryClient.getQueryState(replicationKeys.sources('default'))?.status).toBe('success')
    )
  return view
}
const addPipeline = () =>
  fireEvent.click(screen.getAllByRole('button', { name: 'Add pipeline' })[0])
test.each([true, false, 'retry', 'refresh error'])(
  'opens creation after enabling when needed (enabled: %s)',
  async (enabled) => {
    isEnabled = enabled === true
    options.failEnable = enabled === 'retry'
    const view = await renderList()
    options.failRefresh = enabled === 'refresh error'
    options.isLoading = enabled !== true
    options.hasAccess = !options.isLoading
    addPipeline()
    if (enabled !== true) {
      expect(screen.getByText('Checking Pipelines access…')).toBeInTheDocument()
      expect(screen.queryByText('Pipelines requires the Pro plan.')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Enable' })).toBeDisabled()
      options.isLoading = false
      options.hasAccess = true
      view.rerender(<Destinations />)
      fireEvent.click(screen.getByRole('button', { name: 'Enable' }))
      if (enabled === 'retry') {
        await waitFor(() => expect(options.failEnable).toBe(false))
        await waitFor(() => expect(screen.getByRole('button', { name: 'Enable' })).toBeEnabled())
        expect(screen.queryByRole('heading', { name: /Creation sheet/ })).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Enable' }))
      }
    }
    if (enabled === 'refresh error') {
      await screen.findByRole('button', { name: 'Retry' })
      expect(screen.queryByRole('heading', { name: /Creation sheet/ })).not.toBeInTheDocument()
      options.failRefresh = false
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: 'Add pipeline' })[0]).not.toHaveAttribute(
          'aria-disabled',
          'true'
        )
      )
      addPipeline()
    }
    await screen.findByRole('heading', { name: 'Creation sheet: BigQuery' })
  }
)
test('dismissal during enablement prevents a late response opening creation', async () => {
  let finish: (() => void) | undefined
  enableGate = new Promise<void>((resolve) => {
    finish = resolve
  })
  await renderList()
  addPipeline()
  fireEvent.click(await screen.findByRole('button', { name: 'Enable' }))
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  finish?.()
  fireEvent.pointerDown(screen.getByRole('button', { name: 'More actions' }), {
    button: 0,
    ctrlKey: false,
  })
  expect(await screen.findByRole('menuitem', { name: 'Disable Pipelines' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: /Creation sheet/ })).not.toBeInTheDocument()
})
test('creation defaults to BigQuery when destination flags are disabled', async () => {
  options.bigQueryEnabled = false
  isEnabled = true
  await renderList()
  addPipeline()
  await screen.findByRole('heading', { name: 'Creation sheet: BigQuery' })
})
test.each(['loading', 'error'])('blocks creation when source status is %s', async (state) => {
  let finish: (() => void) | undefined
  let hasFailed = false
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: async () => {
      if (state === 'loading')
        await new Promise<void>((resolve) => {
          finish = resolve
        })
      if (state === 'error' && !hasFailed) {
        hasFailed = true
        return HttpResponse.json<APIErrorBody>(
          { message: 'replication API URL is not configured' },
          { status: 503 }
        )
      }
      return HttpResponse.json<components['schemas']['SourcesResponse_Output']>({ sources: [] })
    },
  })
  await renderList(false)
  if (state === 'error') {
    await screen.findByRole('button', { name: 'Retry' })
    const button = screen.getAllByRole('button', { name: 'Add pipeline' })[0]
    expect(button).toHaveAttribute('aria-disabled', 'true')
    fireEvent.focus(button)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Replication unavailable locally')
  } else {
    expect(screen.getAllByRole('button', { name: 'Add pipeline' })[0]).toBeDisabled()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  }
  addPipeline()
  fireEvent.keyDown(document, { key: 'N', shiftKey: true })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: /Creation sheet/ })).not.toBeInTheDocument()
  if (state === 'error') fireEvent.click(await screen.findByRole('button', { name: 'Retry' }))
  else {
    await waitFor(() => expect(finish).toBeDefined())
    finish?.()
  }
  await waitFor(() =>
    expect(screen.getAllByRole('button', { name: 'Add pipeline' })[0]).toBeEnabled()
  )
  addPipeline()
  expect(await screen.findByRole('dialog')).toHaveTextContent('Enable Pipelines')
})

test('renders both wizard entry controls as links', async () => {
  options.wizard = true
  isEnabled = true
  await renderList()
  const links = screen.getAllByRole('link', { name: 'Add pipeline' })
  expect(links).toHaveLength(2)
  links.forEach((link) =>
    expect(link).toHaveAttribute('href', '/project/default/database/pipelines/new')
  )
  fireEvent.click(links[0], { ctrlKey: true })
  expect(options.push).not.toHaveBeenCalled()
  expect(options.navigate).not.toHaveBeenCalled()
})
test.each([false, true])('opens the wizard with the shortcut (TanStack: %s)', async (tanStack) => {
  options.wizard = true
  options.tanStack = tanStack
  isEnabled = true
  await renderList()
  fireEvent.keyDown(document, { key: 'N', shiftKey: true })
  if (tanStack)
    expect(options.navigate).toHaveBeenCalledWith({
      to: '/project/$ref/database/pipelines/new',
      params: { ref: 'default' },
    })
  else expect(options.push).toHaveBeenCalledWith('/project/default/database/pipelines/new')
})
test('enables Pipelines before opening the wizard', async () => {
  options.wizard = true
  await renderList()
  addPipeline()
  expect(options.push).not.toHaveBeenCalled()
  fireEvent.click(await screen.findByRole('button', { name: 'Enable' }))
  await waitFor(() =>
    expect(options.push).toHaveBeenCalledWith('/project/default/database/pipelines/new')
  )
})
test.each(['previewLoading', 'flagsLoaded'] as const)(
  'waits for %s before choosing a creation flow',
  async (gate) => {
    options.previewLoading = gate === 'previewLoading'
    options.flagsLoaded = gate !== 'flagsLoaded'
    isEnabled = true
    const view = await renderList()
    expect(screen.getAllByRole('button', { name: 'Add pipeline' })[0]).toBeDisabled()
    addPipeline()
    fireEvent.keyDown(document, { key: 'N', shiftKey: true })
    expect(options.push).not.toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: /Creation sheet/ })).not.toBeInTheDocument()
    options.previewLoading = false
    options.flagsLoaded = true
    options.wizard = true
    view.rerender(<Destinations />)
    fireEvent.keyDown(document, { key: 'N', shiftKey: true })
    expect(options.push).toHaveBeenCalledWith('/project/default/database/pipelines/new')
  }
)

test('keeps request-access creation in the sheet when no wizard destination is available', async () => {
  options.wizard = true
  options.bigQueryEnabled = false
  isEnabled = true
  await renderList()
  addPipeline()
  expect(
    await screen.findByRole('heading', { name: 'Creation sheet: BigQuery' })
  ).toBeInTheDocument()
  expect(options.push).not.toHaveBeenCalled()
  expect(options.navigate).not.toHaveBeenCalled()
})

describe('regions', () => {
  const clusterOf = (request: Request) =>
    new URL(request.url).searchParams.get('cluster_id') ?? 'omitted'
  const regionName = (cluster: string) => (cluster === '2' ? 'Frankfurt' : 'Singapore')

  const mockRegionResources = ({ failingCluster }: { failingCluster?: string } = {}) => {
    const statusRequests: string[] = []
    isEnabled = true
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/destinations',
      response: ({ request }) => {
        const cluster = clusterOf(request)
        if (cluster === failingCluster)
          return HttpResponse.json<APIErrorBody>(
            { message: 'Cluster unavailable' },
            { status: 503 }
          )
        return HttpResponse.json<components['schemas']['DestinationsResponse_Output']>({
          destinations: [
            {
              id: 1,
              name: `${regionName(cluster)} sync`,
              tenant_id: 'tenant',
              config: { big_query: { project_id: 'project', dataset_id: 'dataset' } },
            },
          ],
        })
      },
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/destinations/:destination_id',
      response: ({ request }) =>
        HttpResponse.json<components['schemas']['DestinationResponse_Output']>({
          id: 1,
          name: `${regionName(clusterOf(request))} sync`,
          tenant_id: 'tenant',
          config: { big_query: { project_id: 'project', dataset_id: 'dataset' } },
        }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines',
      response: ({ request }) => {
        const cluster = clusterOf(request)
        return HttpResponse.json<components['schemas']['PipelinesResponse_Output']>({
          pipelines: [
            {
              id: cluster === '2' ? 'frankfurtpipeline' : '42',
              cluster_id: cluster === '2' ? '2' : '1',
              tenant_id: 'tenant',
              source_id: 42,
              source_name: 'default',
              destination_id: 1,
              destination_name: `${regionName(cluster)} sync`,
              replicator_id: 1,
              config: { publication_name: 'publication' },
            },
          ],
        })
      },
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: ({ request, params }) => {
        statusRequests.push(`${params.pipeline_id}:${clusterOf(request)}`)
        return HttpResponse.json<components['schemas']['PipelineStatusResponse_Output']>({
          pipeline_id: String(params.pipeline_id),
          status: { name: 'started' },
        })
      },
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/replication-status',
      response: ({ params }) =>
        HttpResponse.json<components['schemas']['PipelineReplicationStatusResponse_Output']>({
          pipeline_id: String(params.pipeline_id),
          table_statuses: [],
        }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/version',
      response: ({ params }) =>
        HttpResponse.json<components['schemas']['PipelineVersionResponse_Output']>({
          pipeline_id: String(params.pipeline_id),
          version: { id: 1, name: 'v1' },
        }),
    })
    return { statusRequests }
  }

  const mockRegions = () =>
    addAPIMock({
      method: 'get',
      path: '/platform/replication/regions',
      response: () =>
        HttpResponse.json<components['schemas']['PipelineRegionsResponse_Output']>({
          default_cluster_id: '1',
          regions: [SINGAPORE, FRANKFURT],
        }),
    })

  const renderRegions = () =>
    customRender(
      <PipelineRequestStatusProvider>
        <Destinations />
      </PipelineRequestStatusProvider>,
      {
        // Replication queries retry transient failures; skip the backoff in tests.
        queryClient: new QueryClient({
          defaultOptions: { queries: { retry: false, retryDelay: 0 } },
        }),
        nuqs: { hasMemory: true },
      }
    )

  test('shows a single region like before, without region labels or cluster_id', async () => {
    const { statusRequests } = mockRegionResources()
    renderRegions()

    expect(await screen.findByText('Singapore sync')).toBeInTheDocument()
    expect(screen.queryByText('ap-southeast-1')).not.toBeInTheDocument()
    await waitFor(() => expect(statusRequests).toContain('42:omitted'))
    expect(statusRequests.every((request) => request.endsWith(':omitted'))).toBe(true)
  })

  test('groups pipelines by region and routes each pipeline to its own cluster', async () => {
    mockRegions()
    const { statusRequests } = mockRegionResources()
    renderRegions()

    const singapore = (await screen.findByText('Singapore sync')).closest('tr')
    const frankfurt = (await screen.findByText('Frankfurt sync')).closest('tr')
    expect(screen.getByText('ap-southeast-1')).toBeInTheDocument()
    expect(screen.getByText('eu-central-1')).toBeInTheDocument()
    await waitFor(() =>
      expect(statusRequests).toEqual(expect.arrayContaining(['42:omitted', 'frankfurtpipeline:2']))
    )
    expect(statusRequests).not.toContain('frankfurtpipeline:omitted')
    expect(statusRequests).not.toContain('42:1')

    fireEvent.pointerDown(within(frankfurt!).getByRole('button', { name: 'Pipeline options' }), {
      button: 0,
      ctrlKey: false,
    })
    expect(await screen.findByRole('menuitem', { name: 'View details' })).toHaveAttribute(
      'href',
      '/project/default/database/pipelines/frankfurtpipeline?cluster_id=2'
    )
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    fireEvent.pointerDown(within(singapore!).getByRole('button', { name: 'Pipeline options' }), {
      button: 0,
      ctrlKey: false,
    })
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'View details' })).toHaveAttribute(
        'href',
        '/project/default/database/pipelines/42'
      )
    )
  })

  test('keeps other regions visible when one region fails', async () => {
    mockRegions()
    mockRegionResources({ failingCluster: '2' })
    renderRegions()

    expect(await screen.findByText('Singapore sync')).toBeInTheDocument()
    expect(
      await screen.findByText('Failed to retrieve pipelines in Frankfurt (eu-central-1)')
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Add a pipeline' })).not.toBeInTheDocument()
  })
})
