import { QueryClient } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from '@tanstack/react-router'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { http, HttpResponse } from 'msw'
import { useQueryState } from 'nuqs'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { Destinations } from './Destinations'
import { replicationKeys } from '@/data/replication/keys'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'
import { ReplicationClusterProvider } from '@/state/replication-cluster'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import { customRender, CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer, type APIErrorBody } from '@/tests/lib/msw'

mockAnimationsApi()
const options = vi.hoisted(() => ({
  wizard: false,
  previewLoading: false,
  flagsLoaded: true,
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
vi.mock(
  '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext')
    >()),
    usePipelineCreationPreview: () => ({
      isEnabled: options.wizard,
      isLoading: options.previewLoading,
    }),
  })
)
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
const regionsResponse = (regions: (typeof SINGAPORE)[]) =>
  HttpResponse.json<components['schemas']['PipelineRegionsResponse_Output']>({
    default_cluster_id: '1',
    regions,
  })

const mockRegions = (regions = [SINGAPORE, FRANKFURT]) =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/regions',
    response: () => regionsResponse(regions),
  })

const sourcesResponse = (enabled: boolean) =>
  HttpResponse.json<components['schemas']['SourcesResponse_Output']>({
    sources: enabled
      ? [
          {
            id: 42,
            name: 'default',
            tenant_id: 'tenant',
            config: { host: 'localhost', port: 5432, name: 'postgres', username: 'postgres' },
          },
        ]
      : [],
  })

let isEnabled = false
let enableGate: Promise<void> | undefined
beforeEach(() => {
  options.wizard = false
  options.previewLoading = false
  options.flagsLoaded = true
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
  mockRegions([SINGAPORE])
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
        : sourcesResponse(isEnabled),
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
const listPath = '/project/default/database/pipelines'
const createListRouter = () =>
  createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: [listPath] }),
    parseSearch,
    stringifySearch,
  })
const mountList = (router: ReturnType<typeof createListRouter>, clusterId?: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  })
  const view = customRender(<Destinations />, {
    wrapper: ({ children }) => (
      <CustomWrapper queryClient={queryClient} nuqs={{ hasMemory: true }}>
        <RouterContextProvider router={router}>
          <ReplicationClusterProvider clusterId={clusterId}>
            <PipelineRequestStatusProvider>{children}</PipelineRequestStatusProvider>
          </ReplicationClusterProvider>
        </RouterContextProvider>
      </CustomWrapper>
    ),
  })
  return { ...view, router, queryClient }
}
const renderList = async (waitForSources = true, clusterId?: string) => {
  const router = createListRouter()
  await router.load()
  const view = mountList(router, clusterId)
  await screen.findByRole('heading', { name: 'Add a pipeline' })
  if (waitForSources)
    await waitFor(() =>
      expect(view.queryClient.getQueryState(replicationKeys.sources('default'))?.status).toBe(
        'success'
      )
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
      return sourcesResponse(false)
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
  const { router } = await renderList(true, 'eu-west-1')
  const links = screen.getAllByRole('link', { name: 'Add pipeline' })
  expect(links).toHaveLength(2)
  links.forEach((link) => expect(link).toHaveAttribute('href', `${listPath}/new`))
  fireEvent.click(links[0], { ctrlKey: true })
  expect(router.history.location.href).toBe(listPath)
})
test('opens the wizard from the combined list with the shortcut', async () => {
  options.wizard = true
  isEnabled = true
  const { router } = await renderList(true, 'eu-west-1')
  fireEvent.keyDown(document, { key: 'N', shiftKey: true })
  await waitFor(() => expect(router.history.location.href).toBe(`${listPath}/new`))
})
test('enables Pipelines before opening the wizard', async () => {
  options.wizard = true
  const { router } = await renderList()
  addPipeline()
  expect(router.history.location.href).toBe(listPath)
  fireEvent.click(await screen.findByRole('button', { name: 'Enable' }))
  await waitFor(() => expect(router.history.location.href).toBe(`${listPath}/new`))
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
    expect(view.router.history.location.href).toBe(listPath)
    expect(screen.queryByRole('heading', { name: /Creation sheet/ })).not.toBeInTheDocument()
    options.previewLoading = false
    options.flagsLoaded = true
    options.wizard = true
    view.rerender(<Destinations />)
    fireEvent.keyDown(document, { key: 'N', shiftKey: true })
    await waitFor(() => expect(view.router.history.location.href).toBe(`${listPath}/new`))
  }
)

test('keeps request-access creation in the sheet when no wizard destination is available', async () => {
  options.wizard = true
  options.bigQueryEnabled = false
  isEnabled = true
  const { router } = await renderList()
  addPipeline()
  expect(
    await screen.findByRole('heading', { name: 'Creation sheet: BigQuery' })
  ).toBeInTheDocument()
  expect(router.history.location.href).toBe(listPath)
})

describe('regions', () => {
  const clusterOf = (request: Request) =>
    new URL(request.url).searchParams.get('cluster_id') ?? 'omitted'
  const regionName = (cluster: string) => (cluster === '2' ? 'Frankfurt' : 'Singapore')

  const regionDestination = (cluster: string) => ({
    id: 1,
    name: `${regionName(cluster)} sync`,
    tenant_id: 'tenant',
    config: { big_query: { project_id: 'project', dataset_id: 'dataset' } },
  })

  const mockRegionResources = ({
    failingClusters = new Set<string>(),
    pendingFrankfurt,
    frankfurtResponse,
    hasDestinations = true,
  }: {
    failingClusters?: Set<string>
    pendingFrankfurt?: Promise<void>
    frankfurtResponse?: Promise<Response>
    hasDestinations?: boolean
  } = {}) => {
    const statusRequests: string[] = []
    isEnabled = true
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/destinations',
      response: async ({ request }) => {
        const cluster = clusterOf(request)
        if (cluster === '2') await pendingFrankfurt
        if (failingClusters.has(cluster))
          return HttpResponse.json<APIErrorBody>(
            { message: 'Cluster unavailable' },
            { status: 503 }
          )
        if (cluster === '2' && frankfurtResponse) return frankfurtResponse
        return HttpResponse.json<components['schemas']['DestinationsResponse_Output']>({
          destinations: hasDestinations ? [regionDestination(cluster)] : [],
        })
      },
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/destinations/:destination_id',
      response: ({ request }) =>
        HttpResponse.json<components['schemas']['DestinationResponse_Output']>(
          regionDestination(clusterOf(request))
        ),
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
          status: { name: clusterOf(request) === '2' ? 'started' : 'failed' },
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

  const renderRegions = () => mountList(createListRouter())

  test('shows the pipeline region for a single region without cluster_id', async () => {
    const { statusRequests } = mockRegionResources()
    renderRegions()

    const row = (await screen.findByText('Singapore sync')).closest('tr')
    expect(within(row!).getByRole('cell', { name: 'Singapore' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Region' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Publication' })).not.toBeInTheDocument()
    await waitFor(() => expect(statusRequests).toContain('42:omitted'))
    expect(statusRequests.every((request) => request.endsWith(':omitted'))).toBe(true)
  })

  test('shows each pipeline region and routes each pipeline to its cluster', async () => {
    mockRegions()
    const { statusRequests } = mockRegionResources()
    renderRegions()

    const singapore = (await screen.findByText('Singapore sync')).closest('tr')
    const frankfurt = (await screen.findByText('Frankfurt sync')).closest('tr')
    expect(within(singapore!).getByRole('cell', { name: 'Singapore' })).toBeInTheDocument()
    expect(within(frankfurt!).getByRole('cell', { name: 'Frankfurt' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Region' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Publication' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('row').slice(1)).toEqual([frankfurt, singapore])
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

  test('sorts and filters pipelines across regions', async () => {
    mockRegions()
    mockRegionResources()
    renderRegions()

    await screen.findByText('Failed')
    await screen.findByText('Running')
    const singapore = screen.getByRole('row', { name: /Singapore sync/ })
    const frankfurt = screen.getByRole('row', { name: /Frankfurt sync/ })
    fireEvent.click(
      within(screen.getByRole('columnheader', { name: 'Status' })).getByRole('button')
    )
    expect(screen.getAllByRole('row').slice(1)).toEqual([singapore, frankfurt])

    fireEvent.change(screen.getByPlaceholderText('Search pipelines'), {
      target: { value: 'FRANKFURT' },
    })
    expect(screen.getAllByRole('row').slice(1)).toEqual([frankfurt])
    expect(screen.queryByRole('row', { name: /Singapore sync/ })).not.toBeInTheDocument()
  })

  test('shows loaded pipelines while another region is loading', async () => {
    mockRegions()
    let finishFrankfurt = () => {}
    const pendingFrankfurt = new Promise<void>((resolve) => {
      finishFrankfurt = resolve
    })
    mockRegionResources({ pendingFrankfurt })
    renderRegions()

    expect(await screen.findByText('Singapore sync')).toBeInTheDocument()
    expect(screen.getByText('Loading pipelines from remaining regions')).toBeInTheDocument()
    finishFrankfurt()
    expect(await screen.findByText('Frankfurt sync')).toBeInTheDocument()
    expect(screen.queryByText('Loading pipelines from remaining regions')).not.toBeInTheDocument()
  })

  test('keeps loading when an empty region finishes before another region', async () => {
    mockRegions()
    let finishRegion = () => {}
    const pendingRegion = new Promise<void>((resolve) => {
      finishRegion = resolve
    })
    mockRegionResources({ pendingFrankfurt: pendingRegion, hasDestinations: false })
    renderRegions()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Add pipeline' })).toBeEnabled())
    expect(screen.getByRole('status')).toHaveTextContent('Loading pipelines')
    expect(screen.queryByRole('heading', { name: 'Add a pipeline' })).not.toBeInTheDocument()
    finishRegion()
    expect(await screen.findByRole('heading', { name: 'Add a pipeline' })).toBeInTheDocument()
  })

  test('keeps other regions visible and retries a failed region', async () => {
    mockRegions()
    const failingClusters = new Set(['2'])
    mockRegionResources({ failingClusters })
    renderRegions()

    expect(await screen.findByText('Singapore sync')).toBeInTheDocument()
    expect(await screen.findByText('Could not load results from Frankfurt')).toBeInTheDocument()
    expect(
      screen.getByText('Any pipelines in this region are missing from this view. Please try again.')
    ).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()

    expect(screen.queryByRole('heading', { name: 'Add a pipeline' })).not.toBeInTheDocument()
    failingClusters.clear()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Frankfurt sync')).toBeInTheDocument()
  })

  test('uses one loading row and one warning for several unavailable regions', async () => {
    mockRegions([
      SINGAPORE,
      FRANKFURT,
      { cluster_id: '3', region_code: 'ap-southeast-2', region_name: 'Sydney' },
      { cluster_id: '4', region_code: 'us-east-1', region_name: 'Virginia' },
    ])
    mockRegionResources()
    const pending = Promise.withResolvers<void>()
    let unavailable = true
    const requests: string[] = []
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/destinations',
      response: async ({ request }) => {
        const cluster = clusterOf(request)
        requests.push(cluster)
        if (cluster !== 'omitted') {
          await pending.promise
          if (unavailable)
            return HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 503 })
        }
        return HttpResponse.json<components['schemas']['DestinationsResponse_Output']>({
          destinations: [regionDestination(cluster)],
        })
      },
    })
    renderRegions()
    try {
      await screen.findByText('Singapore sync')
      expect(screen.getAllByText('Loading pipelines from remaining regions')).toHaveLength(1)
    } finally {
      pending.resolve()
    }
    await screen.findByText('Could not load results from some regions')
    expect(screen.queryByText('Loading pipelines from remaining regions')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Retry' })).toHaveLength(1)
    const defaultRequests = requests.filter((cluster) => cluster === 'omitted').length
    unavailable = false
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() =>
      expect(screen.queryByText('Could not load results from some regions')).not.toBeInTheDocument()
    )
    expect(requests.filter((cluster) => cluster === 'omitted')).toHaveLength(defaultRequests)
  })

  test('shows regional errors instead of the empty state when all regions fail', async () => {
    mockRegions()
    mockRegionResources({ failingClusters: new Set(['omitted', '2']) })
    renderRegions()

    expect(await screen.findByText('Could not load results from some regions')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Retry' })).toHaveLength(1)
    expect(
      screen.getByText('Any pipelines in these regions are missing from this view:')
    ).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').some((item) => item.textContent === 'Singapore')).toBe(
      true
    )
    expect(screen.getAllByRole('listitem').some((item) => item.textContent === 'Frankfurt')).toBe(
      true
    )
    expect(screen.queryByRole('heading', { name: 'Add a pipeline' })).not.toBeInTheDocument()
  })

  test('keeps loaded rows visible while another region loads or fails', async () => {
    mockRegions()
    const frankfurt = Promise.withResolvers<Response>()
    mockRegionResources({ frankfurtResponse: frankfurt.promise })
    renderRegions()
    try {
      expect(await screen.findByText('Singapore sync')).toBeInTheDocument()
    } finally {
      frankfurt.resolve(
        HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 503 })
      )
    }
    await screen.findByText('Could not load results from Frankfurt')
    expect(screen.getByText('Singapore sync')).toBeInTheDocument()
  })

  const mockRegionalDisable = (enabledClusters = new Set(['omitted', '2'])) => {
    const requests: string[] = []
    const failingClusters = new Set<string>()
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/sources',
      response: ({ request }) => sourcesResponse(enabledClusters.has(clusterOf(request))),
    })
    addAPIMock({
      method: 'delete',
      path: '/platform/replication/:ref/tenants',
      response: ({ request }) => {
        const cluster = clusterOf(request)
        requests.push(cluster)
        if (failingClusters.has(cluster))
          return HttpResponse.json<APIErrorBody>(
            { message: 'Cluster unavailable' },
            { status: 503 }
          )
        enabledClusters.delete(cluster)
        return new HttpResponse(null, { status: 200 })
      },
    })

    return { requests, failingClusters }
  }

  const openDisableDialog = async () => {
    await screen.findByRole('heading', { name: 'Add a pipeline' })
    fireEvent.pointerDown(screen.getByRole('button', { name: 'More actions' }), {
      button: 0,
      ctrlKey: false,
    })
    const menuItem = await screen.findByRole('menuitem', { name: 'Disable Pipelines' })
    expect(menuItem).not.toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(menuItem)

    return await screen.findByRole('alertdialog', { name: 'Disable Pipelines' })
  }

  test('opens creation directly when only a non-default region has a source', async () => {
    options.wizard = true
    const enabledClusters = new Set(['2'])
    mockRegions()
    mockRegionalDisable(enabledClusters)
    renderRegions()

    const disableDialog = await openDisableDialog()
    fireEvent.click(within(disableDialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(disableDialog).not.toBeInTheDocument())

    for (const link of screen.getAllByRole('link', { name: 'Add pipeline' })) {
      expect(link).toHaveAttribute('href', `${listPath}/new`)
    }
    expect(screen.queryByRole('dialog', { name: 'Enable Pipelines' })).not.toBeInTheDocument()
    expect(enabledClusters).toEqual(new Set(['2']))
  })

  test('disables Pipelines in each region with a project source', async () => {
    mockRegions([
      SINGAPORE,
      FRANKFURT,
      { cluster_id: '3', region_code: 'us-east-1', region_name: 'Virginia' },
    ])
    const { requests } = mockRegionalDisable()
    renderRegions()

    const dialog = await openDisableDialog()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Disable Pipelines' }))

    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    expect(requests).toEqual(['omitted', '2'])
  })

  test('reports partial disablement and retries only failed regions', async () => {
    mockRegions()
    const { requests, failingClusters } = mockRegionalDisable()
    failingClusters.add('2')
    renderRegions()

    const dialog = await openDisableDialog()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Disable Pipelines' }))

    expect(
      await within(dialog).findByText('Pipelines disabled in some regions')
    ).toBeInTheDocument()
    expect(requests).toEqual(['omitted', '2'])

    failingClusters.clear()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Retry' }))

    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    expect(requests).toEqual(['omitted', '2', '2'])
  })

  test('keeps disablement unavailable until region discovery succeeds', async () => {
    let canDiscoverRegions = false
    addAPIMock({
      method: 'get',
      path: '/platform/replication/regions',
      response: () =>
        canDiscoverRegions
          ? regionsResponse([SINGAPORE, FRANKFURT])
          : HttpResponse.json<APIErrorBody>({ message: 'Regions unavailable' }, { status: 503 }),
    })
    const { requests } = mockRegionalDisable()
    renderRegions()

    expect(await screen.findByText('Failed to retrieve pipeline regions')).toBeInTheDocument()
    await screen.findByRole('heading', { name: 'Add a pipeline' })
    fireEvent.pointerDown(screen.getByRole('button', { name: 'More actions' }), {
      button: 0,
      ctrlKey: false,
    })
    expect(await screen.findByRole('menuitem', { name: /Disable Pipelines/ })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(requests).toEqual([])

    canDiscoverRegions = true
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }))
    expect(await openDisableDialog()).toBeInTheDocument()
  })

  test('retries failed non-default source reads before allowing disablement', async () => {
    mockRegions()
    isEnabled = true
    let canReadSource = false
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/sources',
      response: ({ request }) =>
        clusterOf(request) === '2' && !canReadSource
          ? HttpResponse.json<APIErrorBody>({ message: 'Cluster unavailable' }, { status: 503 })
          : sourcesResponse(true),
    })
    renderRegions()

    expect(
      await screen.findByText('Could not load results from Frankfurt')
    ).toBeInTheDocument()

    canReadSource = true
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await openDisableDialog()).toBeInTheDocument()
  })
  test('blocks an open disable dialog when a pipeline appears', async () => {
    mockRegions([SINGAPORE])
    isEnabled = true
    const { queryClient } = renderRegions()
    await screen.findByRole('heading', { name: 'Add a pipeline' })
    fireEvent.pointerDown(screen.getByRole('button', { name: 'More actions' }), {
      button: 0,
      ctrlKey: false,
    })
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Disable Pipelines' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Disable Pipelines' })
    expect(within(dialog).getByRole('button', { name: 'Disable Pipelines' })).toBeEnabled()
    mockRegionResources()
    await act(() =>
      queryClient.invalidateQueries({ queryKey: replicationKeys.pipelines('default') })
    )
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Disable Pipelines' })).toBeDisabled()
    )
  })
})

test('sorts populated pipeline rows by name and status and filters them by name', async () => {
  isEnabled = true
  const destinations = [
    { id: 1, name: 'Zulu sync' },
    { id: 2, name: 'Alpha export' },
  ].map((destination) => ({
    ...destination,
    tenant_id: 'tenant',
    config: { big_query: { project_id: 'project', dataset_id: 'dataset' } },
  }))
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations',
    response: () =>
      HttpResponse.json<components['schemas']['DestinationsResponse_Output']>({ destinations }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations/:destination_id',
    response: ({ params }) => {
      const destination = destinations.find(({ id }) => String(id) === params.destination_id)
      if (!destination)
        return HttpResponse.json<APIErrorBody>({ message: 'Not found' }, { status: 404 })
      return HttpResponse.json<components['schemas']['DestinationResponse_Output']>(destination)
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines',
    response: () =>
      HttpResponse.json<components['schemas']['PipelinesResponse_Output']>({
        pipelines: destinations.map(({ id, name, tenant_id }) => ({
          id: String(id),
          cluster_id: '1',
          tenant_id,
          source_id: 42,
          source_name: 'default',
          destination_id: id,
          destination_name: name,
          replicator_id: id,
          config: { publication_name: 'publication' },
        })),
      }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
    response: ({ params }) =>
      HttpResponse.json<components['schemas']['PipelineStatusResponse_Output']>({
        pipeline_id: String(params.pipeline_id),
        status: { name: params.pipeline_id === '1' ? 'failed' : 'started' },
      }),
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

  mountList(createListRouter())
  const alpha = await screen.findByRole('row', { name: /Alpha export.*Running/ })
  const zulu = await screen.findByRole('row', { name: /Zulu sync.*Failed/ })
  const pipelineRows = () => screen.getAllByRole('row').slice(1)
  expect(pipelineRows()).toEqual([alpha, zulu])
  fireEvent.click(screen.getByRole('button', { name: 'Name' }))
  expect(pipelineRows()).toEqual([zulu, alpha])
  fireEvent.click(screen.getByRole('button', { name: 'Status' }))
  expect(pipelineRows()).toEqual([zulu, alpha])
  fireEvent.click(screen.getByRole('button', { name: 'Status' }))
  expect(pipelineRows()).toEqual([alpha, zulu])
  fireEvent.change(screen.getByPlaceholderText('Search pipelines'), { target: { value: 'ZULU' } })
  expect(pipelineRows()).toEqual([zulu])
})
