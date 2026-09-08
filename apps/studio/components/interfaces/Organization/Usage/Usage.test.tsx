import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Usage } from './Usage'
import { customRender } from '@/tests/lib/custom-render'

const {
  mockUseAsyncCheckPermissions,
  mockUseOrgDailyStatsQuery,
  mockUseOrgSubscriptionQuery,
  mockUseProjectDetailQuery,
} = vi.hoisted(() => ({
  mockUseAsyncCheckPermissions: vi.fn(),
  mockUseOrgDailyStatsQuery: vi.fn(),
  mockUseOrgSubscriptionQuery: vi.fn(),
  mockUseProjectDetailQuery: vi.fn(),
}))

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ slug: 'test-org' }),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: mockUseAsyncCheckPermissions,
}))

vi.mock('@/data/analytics/org-daily-stats-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/data/analytics/org-daily-stats-query')>()),
  useOrgDailyStatsQuery: mockUseOrgDailyStatsQuery,
}))

vi.mock('@/data/projects/project-detail-query', () => ({
  useProjectDetailQuery: mockUseProjectDetailQuery,
}))

vi.mock('@/data/subscriptions/org-subscription-query', () => ({
  useOrgSubscriptionQuery: mockUseOrgSubscriptionQuery,
}))

describe('Usage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseAsyncCheckPermissions.mockReturnValue({ can: true, isLoading: false })
    mockUseProjectDetailQuery.mockReturnValue({
      data: {
        ref: 'ha-project',
        name: 'HA project',
        high_availability: true,
      },
      isPending: false,
    })
    mockUseOrgSubscriptionQuery.mockReturnValue({
      data: undefined,
      error: undefined,
      isPending: false,
      isError: false,
      isSuccess: false,
    })
    mockUseOrgDailyStatsQuery.mockReturnValue({
      data: undefined,
      error: undefined,
      isPending: false,
      isError: false,
    })
  })

  it('shows a coming-soon empty state for a High Availability project', () => {
    customRender(<Usage />, {
      nuqs: { searchParams: { projectRef: 'ha-project' } },
    })

    expect(screen.getByText('Usage unavailable on High Availability projects')).toBeInTheDocument()
    expect(
      screen.getByText('Usage insights for High Availability projects are coming soon.')
    ).toBeInTheDocument()
    expect(screen.queryByText('Usage filtered by project')).not.toBeInTheDocument()

    expect(mockUseProjectDetailQuery).toHaveBeenCalledWith({ ref: 'ha-project' })
    expect(mockUseOrgSubscriptionQuery).toHaveBeenCalledWith(
      { orgSlug: 'test-org' },
      { enabled: false }
    )
    expect(mockUseOrgDailyStatsQuery).toHaveBeenCalledWith(
      expect.objectContaining({ orgSlug: 'test-org', projectRef: 'ha-project' }),
      { enabled: false }
    )
  })
})
