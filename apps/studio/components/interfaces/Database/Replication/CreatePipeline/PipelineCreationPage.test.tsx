import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'

import PipelineCreationPage from '@/pages/project/[ref]/database/pipelines/new'
import { customRender } from '@/tests/lib/custom-render'

const state = vi.hoisted(() => ({
  push: vi.fn(),
  enabled: false,
  loading: false,
  flagsLoaded: true,
  orgPending: false,
  isHighAvailability: false,
  canUseReplication: true,
}))
vi.mock('next/router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/router')>()),
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

it('returns through the shared router without reloading the toast host', () => {
  customRender(<PipelineCreationPage />)
  fireEvent.click(screen.getByRole('button', { name: 'Wizard form' }))
  expect(state.push).toHaveBeenCalledWith('/project/default/database/pipelines')
})
