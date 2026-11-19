import { QueryClient } from '@tanstack/react-query'
import { act, fireEvent, screen } from '@testing-library/react'
import type { components } from 'api-types'
import { delay, HttpResponse } from 'msw'
import { useSyncExternalStore } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'

import { replicationKeys } from '@/data/replication/keys'
import { Route } from '@/routes/project/$ref/database/pipelines/new'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { renderRoute } from '@/tests/lib/route-render'

const state = vi.hoisted(() => ({
  hasProjectRef: true,
  navigate: vi.fn(),
  enabled: false,
  loading: false,
  flagsLoaded: true,
  orgPending: false,
  isHighAvailability: false,
  canUseReplication: true,
}))
// lets the mocked hooks re-render the page when a test changes `state` after mounting
const stateStore = vi.hoisted(() => {
  const listeners = new Set<() => void>()
  let version = 0
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getVersion: () => version,
    notify: () => {
      version += 1
      listeners.forEach((listener) => listener())
    },
  }
})
const useStateVersion = () => useSyncExternalStore(stateStore.subscribe, stateStore.getVersion)
const setState = (overrides: Partial<typeof state>) =>
  act(() => {
    Object.assign(state, overrides)
    stateStore.notify()
  })

// navigation is asserted on the calls so the page's transient states stay observable
vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => state.navigate,
}))
vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => {
    useStateVersion()
    return { ref: state.hasProjectRef ? 'default' : undefined }
  },
  useFeatureFlags: () => ({ hasLoaded: state.flagsLoaded }),
}))
vi.mock('@/hooks/misc/withAuth', () => ({ withAuth: (component: unknown) => component }))
vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ isPending: state.orgPending }),
}))
vi.mock('@/hooks/misc/useHighAvailability', () => ({
  useHighAvailability: () => ({ isPending: false, isHighAvailability: state.isHighAvailability }),
}))
vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => state.canUseReplication,
}))
vi.mock('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  usePipelineCreationPreview: () => {
    useStateVersion()
    return { isEnabled: state.enabled, isLoading: state.loading }
  },
}))
vi.mock('@/components/interfaces/Database/Replication/useIsPipelinesEnabled', () => ({
  useIsPipelinesBigQueryEnabled: () => true,
  useIsPipelinesDuckLakeEnabled: () => false,
  useIsPipelinesSnowflakeEnabled: () => false,
  useIsPipelinesClickHouseEnabled: () => false,
}))
vi.mock('@/components/layouts/Navigation/LayoutHeader/HomeIcon', () => ({
  HomeIcon: () => <a href="/dashboard/projects">Supabase home</a>,
}))
vi.mock('@/components/layouts/AppLayout/OrganizationDropdown', () => ({
  OrganizationDropdown: () => <span>Organization</span>,
}))
vi.mock('@/components/layouts/Navigation/NavigationBar/OrgSelector', () => ({
  OrgSelector: () => <span>Organization</span>,
}))
vi.mock('@/components/layouts/AppLayout/ProjectDropdown', () => ({
  ProjectDropdown: () => <span>Project</span>,
}))
vi.mock('./PipelineCreationFlow', () => ({
  PipelineCreationFlow: ({ onClose }: { onClose: () => void }) => (
    <button tabIndex={0} onClick={onClose}>
      Wizard form
    </button>
  ),
}))

const pipelinesList = { to: '/project/$ref/database/pipelines', params: { ref: 'default' } }
const renderPage = (options?: { queryClient?: QueryClient }) =>
  renderRoute(Route, {
    routeId: '/project/$ref/database/pipelines/new',
    url: '/project/default/database/pipelines/new',
    ...options,
  })

const mockSources = (sources: components['schemas']['SourcesResponse_Output']['sources']) =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () => HttpResponse.json<components['schemas']['SourcesResponse_Output']>({ sources }),
  })
beforeEach(() => {
  state.navigate.mockClear()
  mockSources([
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
  ])
  Object.assign(state, {
    hasProjectRef: true,
    enabled: true,
    loading: false,
    flagsLoaded: true,
    orgPending: false,
    isHighAvailability: false,
    canUseReplication: true,
  })
})
it('renders the page body when the preview and project allow access', async () => {
  await renderPage()
  expect(await screen.findByText('Wizard form')).toBeInTheDocument()
})
it.each([
  { loading: true },
  { orgPending: true },
  { flagsLoaded: false },
  { enabled: false },
  { canUseReplication: false },
  { isHighAvailability: true },
])('does not expose the wizard when %o', async (overrides) => {
  Object.assign(state, overrides)
  await renderPage()
  expect(screen.queryByText('Wizard form')).not.toBeInTheDocument()
})

it('falls back when the preview is off even if organisation and project queries stay pending', async () => {
  state.enabled = false
  state.orgPending = true
  state.flagsLoaded = false
  await renderPage()
  expect(screen.getByRole('status', { name: 'Pipeline creation status' })).toHaveTextContent(
    'Opening Pipelines…'
  )
  expect(state.navigate).toHaveBeenCalledWith({
    ...pipelinesList,
    search: { destinationType: 'BigQuery' },
    replace: true,
  })
})

it('returns through the shared router without reloading the toast host', async () => {
  await renderPage()
  fireEvent.click(await screen.findByRole('button', { name: 'Wizard form' }))
  expect(state.navigate).toHaveBeenCalledWith(pipelinesList)
})

it.each(['disabled', 'error'])(
  'returns direct entry to Pipelines when enablement is %s',
  async (status) => {
    if (status === 'disabled') mockSources([])
    else
      addAPIMock({
        method: 'get',
        path: '/platform/replication/:ref/sources',
        response: () =>
          HttpResponse.json<APIErrorBody>(
            { message: 'replication API URL is not configured' },
            { status: 503 }
          ),
      })
    await renderPage()
    expect(await screen.findByText('Returning to Pipelines…')).toBeInTheDocument()
    expect(screen.queryByText('Wizard form')).not.toBeInTheDocument()
    expect(state.navigate).toHaveBeenCalledWith({ ...pipelinesList, replace: true })
  }
)

it.each([false, true])('waits for the project reference (preview: %s)', async (enabled) => {
  state.enabled = enabled
  state.hasProjectRef = false
  await renderPage()
  expect(screen.queryByText('Returning to Pipelines…')).not.toBeInTheDocument()
  expect(screen.queryByText('Wizard form')).not.toBeInTheDocument()
  expect(state.navigate).not.toHaveBeenCalled()
})
it('rechecks cached enablement before allowing direct entry', async () => {
  const queryClient = new QueryClient()
  queryClient.setQueryData(replicationKeys.sources('default'), {
    sources: [{ id: 42, name: 'default' }],
  })
  let finish: (() => void) | undefined
  const gate = new Promise<void>((resolve) => {
    finish = resolve
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: async () => {
      await gate
      return HttpResponse.json<components['schemas']['SourcesResponse_Output']>({ sources: [] })
    },
  })
  await renderPage({ queryClient })
  expect(screen.queryByText('Wizard form')).not.toBeInTheDocument()
  expect(screen.queryByText('Returning to Pipelines…')).not.toBeInTheDocument()
  finish?.()
  expect(await screen.findByText('Returning to Pipelines…')).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Pipeline creation' })).toBeInTheDocument()
  expect(screen.queryByText('Wizard form')).not.toBeInTheDocument()
})

it('keeps the header and disabled destination step visible while preview access loads', async () => {
  state.loading = true
  await renderPage()
  expect(screen.getByRole('navigation', { name: 'Pipeline creation' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Choose a destination' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(state.navigate).toHaveBeenCalledWith(pipelinesList)
})

it('uses the shared router for loading header links with their existing base path', async () => {
  state.loading = true
  await renderPage()
  const home = screen.getByRole('link', { name: 'Supabase home' })

  fireEvent.click(home)

  expect(state.navigate).toHaveBeenCalledTimes(1)
  expect(state.navigate).toHaveBeenCalledWith({ to: '/dashboard/projects', search: {}, hash: '' })
})

it('keeps the header visible while source enablement loads', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: async () => {
      await delay('infinite')
      return HttpResponse.json<components['schemas']['SourcesResponse_Output']>({ sources: [] })
    },
  })
  await renderPage()
  expect(await screen.findByRole('navigation', { name: 'Pipeline creation' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Choose a destination' })).toBeInTheDocument()
  expect(screen.queryByText('Wizard form')).not.toBeInTheDocument()
})

it('keeps the same live status when loading finishes and the wizard is ready', async () => {
  state.loading = true
  await renderPage()
  const status = screen.getByRole('status', { name: 'Pipeline creation status' })
  expect(status).toHaveTextContent('Loading pipeline creation…')

  setState({ loading: false })

  expect(await screen.findByText('Wizard form')).toBeInTheDocument()
  expect(screen.getByRole('status', { name: 'Pipeline creation status' })).toBe(status)
  expect(status).toHaveTextContent('Pipeline creation ready')
})

it('keeps the same live status when loading finishes with a redirect', async () => {
  state.loading = true
  await renderPage()
  const status = screen.getByRole('status', { name: 'Pipeline creation status' })
  expect(status).toHaveTextContent('Loading pipeline creation…')

  setState({ loading: false, enabled: false })

  expect(screen.getByRole('status', { name: 'Pipeline creation status' })).toBe(status)
  expect(status).toHaveTextContent('Opening Pipelines…')
})

it('only navigates on Close once the project reference is available', async () => {
  state.hasProjectRef = false
  state.loading = true
  await renderPage()
  const close = screen.getByRole('button', { name: 'Close' })
  expect(close).toBeEnabled()
  fireEvent.click(close)
  expect(state.navigate).not.toHaveBeenCalled()

  setState({ hasProjectRef: true })

  expect(close).toBeEnabled()
  fireEvent.click(close)
  expect(state.navigate).toHaveBeenCalledWith(pipelinesList)
})
