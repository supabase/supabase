import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AdvisorSection } from '@/components/interfaces/ProjectHome/AdvisorSection'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AdvisorPanel } from '@/components/ui/AdvisorPanel/AdvisorPanel'
import { advisorState } from '@/state/advisor-state'
import { sidebarManagerState } from '@/state/sidebar-manager-state'
import { render } from '@/tests/helpers'

const {
  mockUseProjectLintsQuery,
  mockUseBannedIPsQuery,
  mockUseSelectedProjectQuery,
  mockUseNotificationsV2Query,
  mockUseNotificationsV2UpdateMutation,
  mockUseTrack,
} = vi.hoisted(() => ({
  mockUseProjectLintsQuery: vi.fn(),
  mockUseBannedIPsQuery: vi.fn(),
  mockUseSelectedProjectQuery: vi.fn(),
  mockUseNotificationsV2Query: vi.fn(),
  mockUseNotificationsV2UpdateMutation: vi.fn(),
  mockUseTrack: vi.fn(),
}))

vi.mock('common', async () => {
  const actual = await vi.importActual<typeof import('common')>('common')

  return {
    ...actual,
    useParams: () => ({ ref: 'project-ref' }),
  }
})

vi.mock('@/data/lint/lint-query', () => ({
  useProjectLintsQuery: mockUseProjectLintsQuery,
}))

vi.mock('@/data/banned-ips/banned-ips-query', () => ({
  useBannedIPsQuery: mockUseBannedIPsQuery,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: mockUseSelectedProjectQuery,
}))

vi.mock('@/data/notifications/notifications-v2-query', () => ({
  useNotificationsV2Query: mockUseNotificationsV2Query,
}))

vi.mock('@/data/notifications/notifications-v2-update-mutation', () => ({
  useNotificationsV2UpdateMutation: mockUseNotificationsV2UpdateMutation,
}))

vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))

vi.mock('@/lib/telemetry/track', () => ({
  useTrack: mockUseTrack,
}))

vi.mock('@/state/ai-assistant-state', () => ({
  useAiAssistantStateSnapshot: () => ({
    newChat: vi.fn(),
  }),
}))

vi.mock('@/components/ui/AiAssistantDropdown', () => ({
  AiAssistantDropdown: () => <div data-testid="advisor-assistant-dropdown" />,
}))

vi.mock('./AdvisorFilters', () => ({
  AdvisorFilters: () => <div data-testid="advisor-filters" />,
}))

vi.mock('./AdvisorPanelHeader', () => ({
  AdvisorPanelHeader: () => <div data-testid="advisor-panel-header" />,
}))

describe('Advisor signals integration', () => {
  beforeEach(() => {
    window.localStorage.clear()
    advisorState.reset()
    sidebarManagerState.unregisterSidebar(SIDEBAR_KEYS.ADVISOR_PANEL)
    sidebarManagerState.registerSidebar(SIDEBAR_KEYS.ADVISOR_PANEL, () => null)
    sidebarManagerState.clearActiveSidebar()

    mockUseTrack.mockReturnValue(vi.fn())
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { ref: 'project-ref' },
    })
    mockUseProjectLintsQuery.mockImplementation((_variables, options) => {
      if (options?.enabled === false) {
        return {
          data: undefined,
          isPending: false,
          isError: false,
        }
      }

      return {
        data: [
          {
            cache_key: 'lint-1',
            name: 'unknown_lint',
            detail: 'Critical lint detail',
            level: 'ERROR',
            categories: ['SECURITY'],
            metadata: {},
          },
        ],
        isPending: false,
        isError: false,
      }
    })
    mockUseBannedIPsQuery.mockImplementation((_variables, options) => {
      if (options?.enabled === false) {
        return {
          data: undefined,
          isPending: false,
          isError: false,
        }
      }

      return {
        data: {
          banned_ipv4_addresses: ['203.0.113.10'],
        },
        isPending: false,
        isError: false,
      }
    })
    mockUseNotificationsV2Query.mockReturnValue({
      data: { pages: [[]] },
      isPending: false,
      isError: false,
    })
    mockUseNotificationsV2UpdateMutation.mockReturnValue({
      mutate: vi.fn(),
    })
  })

  afterEach(() => {
    advisorState.reset()
    sidebarManagerState.unregisterSidebar(SIDEBAR_KEYS.ADVISOR_PANEL)
    sidebarManagerState.clearActiveSidebar()
    vi.clearAllMocks()
  })

  it('renders signal items and dismisses them across the homepage and panel', async () => {
    render(
      <>
        <AdvisorSection />
        <AdvisorPanel />
      </>
    )

    expect(screen.getByText('Advisor found 2 issues')).toBeInTheDocument()
    expect(screen.getByText('Banned IP address')).toBeInTheDocument()
    expect(screen.getAllByText('Critical lint detail').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText((_, node) =>
        Boolean(
          node?.textContent?.includes(
            'The IP address 203.0.113.10 is temporarily blocked because of suspicious traffic or repeated failed password attempts.'
          )
        )
      ).length
    ).toBeGreaterThan(0)

    await userEvent.click(screen.getByText('Banned IP address'))

    expect(screen.getByText('Entity')).toBeInTheDocument()
    expect(screen.getByText('Issue')).toBeInTheDocument()
    expect(screen.getByText('Resolve')).toBeInTheDocument()
    expect(screen.getAllByTestId('advisor-assistant-dropdown').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText((_, node) =>
        Boolean(
          node?.textContent?.includes(
            'The IP address 203.0.113.10 is temporarily blocked because of suspicious traffic or repeated failed password attempts.'
          )
        )
      ).length
    ).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
      'href',
      'https://supabase.com/docs/reference/cli/supabase-network-bans'
    )

    expect(screen.getAllByText('Banned IP address').length).toBeGreaterThan(0)

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    await waitFor(() => {
      expect(screen.queryByText('Banned IP address')).not.toBeInTheDocument()
    })

    expect(screen.getAllByText('Critical lint detail').length).toBeGreaterThan(0)
  })

  it('shows an overflow affordance when the homepage cap hides additional issues', () => {
    mockUseProjectLintsQuery.mockImplementation((_variables, options) => {
      if (options?.enabled === false) {
        return {
          data: undefined,
          isPending: false,
          isError: false,
        }
      }

      return {
        data: [
          {
            cache_key: 'lint-1',
            name: 'unknown_lint',
            detail: 'Critical lint detail 1',
            level: 'ERROR',
            categories: ['SECURITY'],
            metadata: {},
          },
          {
            cache_key: 'lint-2',
            name: 'unknown_lint',
            detail: 'Critical lint detail 2',
            level: 'ERROR',
            categories: ['SECURITY'],
            metadata: {},
          },
          {
            cache_key: 'lint-3',
            name: 'unknown_lint',
            detail: 'Critical lint detail 3',
            level: 'ERROR',
            categories: ['SECURITY'],
            metadata: {},
          },
          {
            cache_key: 'lint-4',
            name: 'unknown_lint',
            detail: 'Critical lint detail 4',
            level: 'ERROR',
            categories: ['SECURITY'],
            metadata: {},
          },
        ],
        isPending: false,
        isError: false,
      }
    })

    render(<AdvisorSection />)

    expect(screen.getByText('Advisor found 5 issues')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View 1 more issue in Advisor' })).toBeInTheDocument()
    expect(screen.queryByText('Banned IP address')).not.toBeInTheDocument()
  })

  it('does not block the homepage while signal items are pending', () => {
    mockUseProjectLintsQuery.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    })
    mockUseBannedIPsQuery.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    })

    render(<AdvisorSection />)

    // Lints have loaded — homepage renders without being blocked by signal loading
    expect(screen.getByText('Advisor found no issues')).toBeInTheDocument()
  })
})
