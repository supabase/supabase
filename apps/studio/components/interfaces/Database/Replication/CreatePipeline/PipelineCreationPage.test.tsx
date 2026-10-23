import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen } from '@testing-library/react'
import type { components } from 'api-types'
import { delay, HttpResponse } from 'msw'
import { beforeEach, expect, it, vi } from 'vitest'

import { replicationKeys } from '@/data/replication/keys'
import PipelineCreationPage from '@/pages/project/[ref]/database/pipelines/new'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const state = vi.hoisted(() => ({
  hasProjectRef: true,
  push: vi.fn(),
  replace: vi.fn(),
  enabled: false,
  loading: false,
  flagsLoaded: true,
  orgPending: false,
  isHighAvailability: false,
  canUseReplication: true,
}))
vi.mock('next/router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/router')>()),
  useRouter: () => ({
    push: state.push,
    replace: state.replace,
    events: { on: vi.fn(), off: vi.fn() },
  }),
}))
vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: state.hasProjectRef ? 'default' : undefined }),
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
  usePipelineCreationPreview: () => ({ isEnabled: state.enabled, isLoading: state.loading }),
}))
vi.mock('@/components/interfaces/Database/Replication/useIsETLPrivateAlpha', () => ({
  useIsETLBigQueryPrivateAlpha: () => true,
  useIsETLDucklakePrivateAlpha: () => false,
  useIsETLSnowflakePrivateAlpha: () => false,
  useIsETLClickHousePrivateAlpha: () => false,
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

const mockSources = (sources: components['schemas']['SourcesResponse_Output']['sources']) =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () => HttpResponse.json<components['schemas']['SourcesResponse_Output']>({ sources }),
  })
beforeEach(() => {
  state.push.mockClear()
  state.replace.mockClear()
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
  customRender(<PipelineCreationPage />)
  expect(await screen.findByText('Wizard form')).toBeInTheDocument()
})
it.each(['loading', 'orgPending'] as const)('waits while %s', (key) => {
  state[key] = true
  customRender(<PipelineCreationPage />)
  expect(screen.queryByText('Wizard form')).not.toBeInTheDocument()
})
it('waits for rollout flags', () => {
  state.flagsLoaded = false
  customRender(<PipelineCreationPage />)
  expect(screen.queryByText('Wizard form')).not.toBeInTheDocument()
})
it.each(['enabled', 'canUseReplication'] as const)(
  'does not expose the wizard when %s is false',
  (key) => {
    state[key] = false
    customRender(<PipelineCreationPage />)
    expect(screen.queryByText('Wizard form')).not.toBeInTheDocument()
  }
)
it('does not expose the wizard for High Availability projects', () => {
  state.isHighAvailability = true
  customRender(<PipelineCreationPage />)
  expect(screen.queryByText('Wizard form')).not.toBeInTheDocument()
})

it('falls back when the preview is off even if organisation and project queries stay pending', () => {
  state.enabled = false
  state.orgPending = true
  state.flagsLoaded = false
  customRender(<PipelineCreationPage />)
  expect(screen.getByRole('status', { name: 'Pipeline creation status' })).toHaveTextContent(
    'Opening Pipelines…'
  )
  expect(state.replace).toHaveBeenCalledWith(
    '/project/default/database/pipelines?destinationType=BigQuery'
  )
})

it('returns through the shared router without reloading the toast host', async () => {
  customRender(<PipelineCreationPage />)
  fireEvent.click(await screen.findByRole('button', { name: 'Wizard form' }))
  expect(state.push).toHaveBeenCalledWith('/project/default/database/pipelines')
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
    customRender(<PipelineCreationPage />)
    expect(await screen.findByText('Returning to Pipelines…')).toBeInTheDocument()
    expect(screen.queryByText('Wizard form')).not.toBeInTheDocument()
    expect(state.replace).toHaveBeenCalledWith('/project/default/database/pipelines')
  }
)

it.each([false, true])('waits for the project reference (preview: %s)', (enabled) => {
  state.enabled = enabled
  state.hasProjectRef = false
  customRender(<PipelineCreationPage />)
  expect(screen.queryByText('Returning to Pipelines…')).not.toBeInTheDocument()
  expect(screen.queryByText('Wizard form')).not.toBeInTheDocument()
  expect(state.replace).not.toHaveBeenCalled()
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
  customRender(<PipelineCreationPage />, { queryClient })
  expect(screen.queryByText('Wizard form')).not.toBeInTheDocument()
  expect(screen.queryByText('Returning to Pipelines…')).not.toBeInTheDocument()
  finish?.()
  expect(await screen.findByText('Returning to Pipelines…')).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Pipeline creation' })).toBeInTheDocument()
  expect(screen.queryByText('Wizard form')).not.toBeInTheDocument()
})

it('keeps the header and disabled destination step visible while preview access loads', () => {
  state.loading = true
  customRender(<PipelineCreationPage />)
  expect(screen.getByRole('navigation', { name: 'Pipeline creation' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Choose a destination' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(state.push).toHaveBeenCalledWith('/project/default/database/pipelines')
})

it('uses the shared router for loading header links with their existing base path', () => {
  state.loading = true
  customRender(<PipelineCreationPage />)
  const home = screen.getByRole('link', { name: 'Supabase home' })

  fireEvent.click(home)

  expect(state.push).toHaveBeenCalledWith(`${window.location.origin}/dashboard/projects`)
  expect(state.replace).not.toHaveBeenCalled()
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
  customRender(<PipelineCreationPage />)
  expect(await screen.findByRole('navigation', { name: 'Pipeline creation' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Choose a destination' })).toBeInTheDocument()
  expect(screen.queryByText('Wizard form')).not.toBeInTheDocument()
})

it('keeps the same live status when loading finishes and the wizard is ready', async () => {
  state.loading = true
  const { rerender } = customRender(<PipelineCreationPage />)
  const status = screen.getByRole('status', { name: 'Pipeline creation status' })
  expect(status).toHaveTextContent('Loading pipeline creation…')

  state.loading = false
  rerender(<PipelineCreationPage />)

  expect(await screen.findByText('Wizard form')).toBeInTheDocument()
  expect(screen.getByRole('status', { name: 'Pipeline creation status' })).toBe(status)
  expect(status).toHaveTextContent('Pipeline creation ready')
})

it('keeps the same live status when loading finishes with a redirect', () => {
  state.loading = true
  const { rerender } = customRender(<PipelineCreationPage />)
  const status = screen.getByRole('status', { name: 'Pipeline creation status' })
  expect(status).toHaveTextContent('Loading pipeline creation…')

  state.loading = false
  state.enabled = false
  rerender(<PipelineCreationPage />)

  expect(screen.getByRole('status', { name: 'Pipeline creation status' })).toBe(status)
  expect(status).toHaveTextContent('Opening Pipelines…')
})

it('only navigates on Close once the project reference is available', () => {
  state.hasProjectRef = false
  state.loading = true
  const { rerender } = customRender(<PipelineCreationPage />)
  const close = screen.getByRole('button', { name: 'Close' })
  expect(close).toBeEnabled()
  fireEvent.click(close)
  expect(state.push).not.toHaveBeenCalled()

  state.hasProjectRef = true
  rerender(<PipelineCreationPage />)

  expect(close).toBeEnabled()
  fireEvent.click(close)
  expect(state.push).toHaveBeenCalledWith('/project/default/database/pipelines')
})
