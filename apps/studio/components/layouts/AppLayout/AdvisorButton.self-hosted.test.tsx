import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AdvisorButton } from '@/components/layouts/AppLayout/AdvisorButton'
import { render } from '@/tests/helpers'

const {
  mockUseProjectLintsQuery,
  mockUseNotificationsV2Query,
  mockUseAdvisorSignals,
  mockToggleSidebar,
} = vi.hoisted(() => ({
  mockUseProjectLintsQuery: vi.fn(),
  mockUseNotificationsV2Query: vi.fn(),
  mockUseAdvisorSignals: vi.fn(),
  mockToggleSidebar: vi.fn(),
}))

vi.mock('@/data/lint/lint-query', () => ({
  useProjectLintsQuery: mockUseProjectLintsQuery,
}))

vi.mock('@/data/notifications/notifications-v2-query', () => ({
  useNotificationsV2Query: mockUseNotificationsV2Query,
}))

vi.mock('@/components/ui/AdvisorPanel/useAdvisorSignals', () => ({
  useAdvisorSignals: mockUseAdvisorSignals,
}))

vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: false,
}))

vi.mock('@/state/sidebar-manager-state', () => ({
  useSidebarManagerSnapshot: () => ({
    toggleSidebar: mockToggleSidebar,
    activeSidebar: undefined,
  }),
}))

describe('AdvisorButton on self-hosted', () => {
  beforeEach(() => {
    mockUseProjectLintsQuery.mockReturnValue({ data: [], isPending: false, isError: false })
    mockUseNotificationsV2Query.mockReturnValue({
      data: { pages: [[]] },
      isPending: false,
      isError: false,
    })
    mockUseAdvisorSignals.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      dismissSignal: vi.fn(),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('disables the notifications query so no request is made to the platform endpoint', () => {
    render(<AdvisorButton projectRef="project-ref" />)

    expect(mockUseNotificationsV2Query).toHaveBeenCalledWith(
      { filters: {}, limit: 20 },
      { enabled: false }
    )
  })
})
