import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'

import PipelineCreationPage from '@/pages/project/[ref]/database/pipelines/new'
import { customRender } from '@/tests/lib/custom-render'

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

beforeEach(() => {
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
it('renders the page body when the preview and project allow access', () => {
  customRender(<PipelineCreationPage />)
  expect(screen.getByText('Wizard form')).toBeInTheDocument()
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

it.each([false, true])('returns without reloading the toast host (TanStack: %s)', (isTanStack) => {
  state.isTanStack = isTanStack
  customRender(<PipelineCreationPage />)
  fireEvent.click(screen.getByRole('button', { name: 'Wizard form' }))
  if (isTanStack)
    expect(state.navigate).toHaveBeenCalledWith({
      to: '/project/$ref/database/pipelines',
      params: { ref: 'default' },
    })
  else expect(state.push).toHaveBeenCalledWith('/project/default/database/pipelines')
})
