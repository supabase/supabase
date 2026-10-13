import { screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'

import DatabasePipelinesNewPage from '@/pages/project/[ref]/database/pipelines/new'
import { customRender } from '@/tests/lib/custom-render'

const state = vi.hoisted(() => ({ enabled: true, replace: vi.fn() }))
vi.mock('next/router', () => ({ useRouter: () => ({ replace: state.replace, push: vi.fn() }) }))
vi.mock('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  usePipelineCreationPreview: () => ({ isEnabled: state.enabled, isLoading: false }),
}))
vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({ data: { ref: 'default' }, isPending: false }),
}))
vi.mock('@/hooks/misc/useHighAvailability', () => ({
  useHighAvailability: () => ({ isHighAvailability: false }),
}))
vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({ useIsFeatureEnabled: () => true }))
vi.mock('./CreatePipelineWizard', () => ({ CreatePipelineWizard: () => <h1>Pipeline wizard</h1> }))

beforeEach(() => {
  state.enabled = true
  state.replace.mockClear()
})

test('renders the wizard page under Next without a TanStack router provider', () => {
  customRender(<DatabasePipelinesNewPage dehydratedState={null} />)
  expect(screen.getByRole('heading', { name: 'Pipeline wizard' })).toBeInTheDocument()
})

test('redirects direct wizard URLs to the sheet when the preview is off', async () => {
  state.enabled = false
  customRender(<DatabasePipelinesNewPage dehydratedState={null} />)
  await waitFor(() =>
    expect(state.replace).toHaveBeenCalledWith(
      '/project/default/database/pipelines?destinationType=BigQuery'
    )
  )
  expect(screen.queryByRole('heading', { name: 'Pipeline wizard' })).not.toBeInTheDocument()
})
