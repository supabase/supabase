import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PoolingModesModal } from './PoolingModesModal'
import { customRender } from '@/tests/lib/custom-render'

const {
  mockUseDatabaseSelectorStateSnapshot,
  mockUseDatabaseSettingsStateSnapshot,
  mockUseHighAvailability,
  mockUseSupavisorConfigurationQuery,
} = vi.hoisted(() => ({
  mockUseDatabaseSelectorStateSnapshot: vi.fn(),
  mockUseDatabaseSettingsStateSnapshot: vi.fn(),
  mockUseHighAvailability: vi.fn(),
  mockUseSupavisorConfigurationQuery: vi.fn(),
}))

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'ha-project' }),
}))

vi.mock('@/hooks/misc/useHighAvailability', () => ({
  useHighAvailability: mockUseHighAvailability,
}))

vi.mock('@/data/database/supavisor-configuration-query', () => ({
  useSupavisorConfigurationQuery: mockUseSupavisorConfigurationQuery,
}))

vi.mock('@/state/database-selector', () => ({
  useDatabaseSelectorStateSnapshot: mockUseDatabaseSelectorStateSnapshot,
}))

vi.mock('@/state/database-settings', () => ({
  useDatabaseSettingsStateSnapshot: mockUseDatabaseSettingsStateSnapshot,
}))

const expectEveryQueryCall = (queryMock: ReturnType<typeof vi.fn>, enabled: boolean) => {
  expect(queryMock).toHaveBeenCalled()
  for (const [, options] of queryMock.mock.calls) {
    expect(options).toEqual({ enabled })
  }
}

describe('PoolingModesModal', () => {
  beforeEach(() => {
    mockUseDatabaseSettingsStateSnapshot.mockReturnValue({
      showPoolingModeHelper: true,
      setShowPoolingModeHelper: vi.fn(),
    })
    mockUseDatabaseSelectorStateSnapshot.mockReturnValue({ selectedDatabaseId: 'ha-project' })
    mockUseSupavisorConfigurationQuery.mockReturnValue({ data: undefined })
  })

  it('renders nothing and skips the supavisor query for High Availability projects', () => {
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: true, isPending: false })

    const { container } = customRender(<PoolingModesModal />)

    expect(container).toBeEmptyDOMElement()
    expectEveryQueryCall(mockUseSupavisorConfigurationQuery, false)
  })

  it('does not fetch supavisor config while the high availability state is pending', () => {
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: false, isPending: true })

    customRender(<PoolingModesModal />)

    expectEveryQueryCall(mockUseSupavisorConfigurationQuery, false)
  })

  it('renders the modal and fetches supavisor config for non high availability projects', () => {
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: false, isPending: false })

    customRender(<PoolingModesModal />)

    expect(screen.getByText('Which pooling mode should I use?')).toBeInTheDocument()
    expectEveryQueryCall(mockUseSupavisorConfigurationQuery, true)
  })
})
