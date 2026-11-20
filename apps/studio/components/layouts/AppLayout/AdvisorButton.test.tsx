import { QueryClient } from '@tanstack/react-query'
import { FeatureFlagContext } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AdvisorButton } from '@/components/layouts/AppLayout/AdvisorButton'
import { projectKeys } from '@/data/projects/keys'
import { createMockProject } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'

const render = (component: React.ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
  queryClient.setQueryData(projectKeys.detail('default'), createMockProject({ ref: 'default' }))
  return customRender(
    <FeatureFlagContext.Provider value={{ configcat: { issuesInbox: true }, posthog: {} }}>
      {component}
    </FeatureFlagContext.Provider>,
    { queryClient }
  )
}

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

vi.mock('@/state/sidebar-manager-state', () => ({
  useSidebarManagerSnapshot: () => ({
    toggleSidebar: mockToggleSidebar,
    activeSidebar: undefined,
  }),
}))

describe('AdvisorButton', () => {
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

  it('shows a warning dot when advisor signals are present', () => {
    mockUseAdvisorSignals.mockReturnValue({
      data: [
        {
          id: 'signal-1',
          fingerprint: 'signal:banned-ip:203.0.113.10:v1',
          source: 'signal',
          signalType: 'banned-ip',
          severity: 'warning',
          tab: 'security',
          title: 'Banned IP address',
          description: 'Signal',
          actions: [],
          sourceData: {
            type: 'banned-ip',
            ip: '203.0.113.10',
          },
        },
      ],
      isPending: false,
      isError: false,
      dismissSignal: vi.fn(),
    })

    const { container } = render(<AdvisorButton projectRef="project-ref" />)

    expect(container.querySelector('.bg-warning')).toBeInTheDocument()
    expect(container.querySelector('.bg-destructive')).not.toBeInTheDocument()
    expect(container.querySelector('.bg-primary-bright')).not.toBeInTheDocument()
  })

  it('keeps the destructive dot when a critical issue is present', () => {
    mockUseProjectLintsQuery.mockReturnValue({
      data: [
        {
          cache_key: 'lint-1',
          name: 'unknown_lint',
          detail: 'Critical lint detail',
          description: 'Description',
          level: 'ERROR',
          categories: ['SECURITY'],
          metadata: {},
        },
      ],
      isPending: false,
      isError: false,
    })
    mockUseAdvisorSignals.mockReturnValue({
      data: [
        {
          id: 'signal-1',
          fingerprint: 'signal:banned-ip:203.0.113.10:v1',
          source: 'signal',
          signalType: 'banned-ip',
          severity: 'warning',
          tab: 'security',
          title: 'Banned IP address',
          description: 'Signal',
          actions: [],
          sourceData: {
            type: 'banned-ip',
            ip: '203.0.113.10',
          },
        },
      ],
      isPending: false,
      isError: false,
      dismissSignal: vi.fn(),
    })

    const { container } = render(<AdvisorButton projectRef="project-ref" />)

    expect(container.querySelector('.bg-destructive')).toBeInTheDocument()
    expect(container.querySelector('.bg-warning')).not.toBeInTheDocument()
  })

  it('shows an empty inbox icon when the project has no issues', () => {
    const { container } = render(<AdvisorButton projectRef="project-ref" />)

    expect(container.querySelector('.lucide-inbox')).toBeInTheDocument()
    expect(container.querySelector('.lucide-issues')).not.toBeInTheDocument()
  })

  it('swaps in the issues icon once the project has issues', () => {
    mockUseProjectLintsQuery.mockReturnValue({
      data: [
        {
          cache_key: 'lint-1',
          name: 'unknown_lint',
          detail: 'Lint detail',
          description: 'Description',
          level: 'WARN',
          categories: ['SECURITY'],
          metadata: {},
        },
      ],
      isPending: false,
      isError: false,
    })

    const { container } = render(<AdvisorButton projectRef="project-ref" />)

    expect(container.querySelector('.lucide-issues')).toBeInTheDocument()
    expect(container.querySelector('.lucide-inbox')).not.toBeInTheDocument()
  })

  it('falls back to the brand dot for unread notifications when there are no issues', () => {
    mockUseNotificationsV2Query.mockReturnValue({
      data: {
        pages: [
          [
            {
              id: 'notif-1',
              status: 'new',
              priority: 'Info',
            },
          ],
        ],
      },
      isPending: false,
      isError: false,
    })

    const { container } = render(<AdvisorButton projectRef="project-ref" />)

    expect(container.querySelector('.bg-primary-bright')).toBeInTheDocument()
    expect(container.querySelector('.bg-warning')).not.toBeInTheDocument()
    expect(container.querySelector('.bg-destructive')).not.toBeInTheDocument()
  })

  it('disables the notifications query on self-hosted so no request is made to the platform endpoint', () => {
    render(<AdvisorButton projectRef="project-ref" />)

    expect(mockUseNotificationsV2Query).toHaveBeenCalledWith(
      { filters: {}, limit: 20 },
      { enabled: false }
    )
  })
})
