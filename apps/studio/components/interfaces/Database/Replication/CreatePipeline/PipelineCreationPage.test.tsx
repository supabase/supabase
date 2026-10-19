import { fireEvent, screen } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, expect, it, vi } from 'vitest'

import PipelineCreationPage from '@/pages/project/[ref]/database/pipelines/new'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const state = vi.hoisted(() => ({
  navigate: vi.fn(),
  push: vi.fn(),
  isTanStack: false,
  enabled: false,
  loading: false,
  flagsLoaded: true,
  orgPending: false,
  isHighAvailability: false,
  canUseReplication: true,
}))
vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useRouter: () => (state.isTanStack ? { navigate: state.navigate } : undefined),
}))
vi.mock('next/compat/router', () => ({
  useRouter: () => ({ push: state.push, events: { on: vi.fn(), off: vi.fn() } }),
}))
vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'default' }),
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
    isTanStack: false,
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
  expect(screen.getByRole('status')).toHaveTextContent('Returning to Pipelines')
})

it.each([false, true])(
  'returns without reloading the toast host (TanStack: %s)',
  async (isTanStack) => {
    state.isTanStack = isTanStack
    customRender(<PipelineCreationPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Wizard form' }))
    if (isTanStack)
      expect(state.navigate).toHaveBeenCalledWith({
        to: '/project/$ref/database/pipelines',
        params: { ref: 'default' },
      })
    else expect(state.push).toHaveBeenCalledWith('/project/default/database/pipelines')
  }
)

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
    expect(await screen.findByRole('status')).toHaveTextContent('Returning to Pipelines')
    expect(screen.queryByText('Wizard form')).not.toBeInTheDocument()
  }
)
