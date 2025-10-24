import { act, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

import { LayoutSidebar } from './index'
import { LayoutSidebarProvider, SIDEBAR_KEYS } from './LayoutSidebarProvider'
import { sidebarManagerState } from 'state/sidebar-manager-state'
import { render } from 'tests/helpers'
import { routerMock } from 'tests/lib/route-mock'
import { ResizablePanel, ResizablePanelGroup } from 'ui'

vi.mock('components/ui/AIAssistantPanel/AIAssistant', () => ({
  AIAssistant: () => <div data-testid="ai-assistant-sidebar">AI Assistant</div>,
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
      <ResizablePanelGroup direction="horizontal">
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

    expect(await screen.findByTestId('ai-assistant-sidebar')).toBeInTheDocument()
  })

  it('auto-opens when sidebar query param matches a registered sidebar', async () => {
    routerMock.setCurrentUrl(`/?sidebar=${SIDEBAR_KEYS.AI_ASSISTANT}`)

    renderSidebar()

    await screen.findByTestId('ai-assistant-sidebar')
  })
})
