import { act, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sidebarManagerState } from 'state/sidebar-manager-state'
import { render } from 'tests/helpers'
import { routerMock } from 'tests/lib/route-mock'
import { ResizablePanel, ResizablePanelGroup } from 'ui'
import { LayoutSidebar } from './index'
import { LayoutSidebarProvider, SIDEBAR_KEYS } from './LayoutSidebarProvider'

vi.mock('components/ui/AIAssistantPanel/AIAssistant', () => ({
  AIAssistant: () => <div data-testid="ai-assistant-sidebar">AI Assistant</div>,
}))

vi.mock('components/ui/EditorPanel/EditorPanel', () => ({
  EditorPanel: () => <div data-testid="editor-panel-sidebar">Editor Panel</div>,
}))

vi.mock('components/ui/AdvisorPanel/AdvisorPanel', () => ({
  AdvisorPanel: () => <div data-testid="advisor-panel-sidebar">Advisor Panel</div>,
}))

vi.mock('nuqs', async () => {
  let queryValue = 'ai-assistant'
  return {
    useQueryState: () => [queryValue, (v: string) => (queryValue = v)],
    parseAsString: () => {},
  }
})

const mockProject = {
  id: 1,
  ref: 'default',
  name: 'Project 1',
  status: 'ACTIVE_HEALTHY' as const,
  organization_id: 1,
  cloud_provider: 'AWS',
  region: 'us-east-1',
  inserted_at: new Date().toISOString(),
  subscription_id: 'subscription-1',
  db_host: 'db.supabase.co',
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  restUrl: 'https://project-1.supabase.co',
}

let mockProjectData: typeof mockProject | undefined = mockProject

vi.mock('hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => {
    // Access the variable at runtime when the function is called
    return {
      data: mockProjectData,
    }
  },
}))

vi.mock('hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({
    data: {
      id: 1,
      name: 'Organization 1',
      slug: 'test-org',
      plan: { id: 'free', name: 'Free' },
      managed_by: 'supabase',
      is_owner: true,
      billing_email: 'billing@example.com',
      billing_partner: null,
      usage_billing_enabled: false,
      stripe_customer_id: 'stripe-1',
      subscription_id: 'subscription-1',
      organization_requires_mfa: false,
      opt_in_tags: [],
      restriction_status: null,
      restriction_data: null,
      organization_missing_address: false,
    },
  }),
}))

vi.mock('data/telemetry/send-event-mutation', () => ({
  useSendEventMutation: () => ({
    mutate: vi.fn(),
  }),
}))

const resetSidebarManagerState = () => {
  Object.keys(sidebarManagerState.sidebars).forEach((id) => {
    sidebarManagerState.unregisterSidebar(id)
  })
  sidebarManagerState.closeActive()
}

describe('LayoutSidebar', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl('/projects/default')
  })

  afterEach(() => {
    resetSidebarManagerState()
    localStorage.clear()
    vi.clearAllMocks()
  })

  const renderSidebar = () =>
    render(
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel>
          <div />
        </ResizablePanel>
        <LayoutSidebarProvider>
          <LayoutSidebar />
        </LayoutSidebarProvider>
      </ResizablePanelGroup>
    )

  it('does not render when there is no active sidebar', () => {
    renderSidebar()

    expect(screen.queryByTestId('ai-assistant-sidebar')).toBeNull()
  })

  it('renders the active sidebar content when toggled on', async () => {
    renderSidebar()

    await waitFor(() => {
      expect(sidebarManagerState.sidebars[SIDEBAR_KEYS.AI_ASSISTANT]).toBeDefined()
    })

    act(() => {
      sidebarManagerState.toggleSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    })

    const sidebar = await screen.findByTestId('ai-assistant-sidebar')
    expect(sidebar).toBeTruthy()
  })

  describe('at organization level', () => {
    beforeEach(() => {
      routerMock.setCurrentUrl('/org/default')
      // Set project to undefined to simulate org-level (no project)
      mockProjectData = undefined
    })

    afterEach(() => {
      // Reset to project data for other tests
      mockProjectData = mockProject
    })

    it('does not register project-related sidebars when no project is available', async () => {
      renderSidebar()

      // Wait a bit to ensure sidebars have been registered
      await waitFor(() => {
        // Project-related sidebars should not be registered
        expect(sidebarManagerState.sidebars[SIDEBAR_KEYS.AI_ASSISTANT]).toBeUndefined()
        expect(sidebarManagerState.sidebars[SIDEBAR_KEYS.EDITOR_PANEL]).toBeUndefined()
        // Advisor panel should still be available (doesn't require project)
        expect(sidebarManagerState.sidebars[SIDEBAR_KEYS.ADVISOR_PANEL]).toBeDefined()
      })
    })

    it('does not render project-related sidebars even when toggled', async () => {
      renderSidebar()

      await waitFor(() => {
        expect(sidebarManagerState.sidebars[SIDEBAR_KEYS.ADVISOR_PANEL]).toBeDefined()
      })

      // Try to toggle AI_ASSISTANT - should not work since it's not registered
      act(() => {
        sidebarManagerState.toggleSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
      })

      // Should not render since it's not registered
      expect(screen.queryByTestId('ai-assistant-sidebar')).toBeNull()
      expect(screen.queryByTestId('editor-panel-sidebar')).toBeNull()

      // Advisor panel should work
      act(() => {
        sidebarManagerState.toggleSidebar(SIDEBAR_KEYS.ADVISOR_PANEL)
      })

      expect(await screen.findByTestId('advisor-panel-sidebar')).toBeTruthy()
    })
  })

  // [Joshen] JFYI temporarily commented this one out - I'm struggling to figure out the mocking to get this to work
  // it('auto-opens when sidebar query param matches a registered sidebar', async () => {
  //   routerMock.setCurrentUrl(`/?sidebar=${SIDEBAR_KEYS.AI_ASSISTANT}`)
  //   renderSidebar()
  //   await screen.findByTestId('ai-assistant-sidebar')
  // })
})
