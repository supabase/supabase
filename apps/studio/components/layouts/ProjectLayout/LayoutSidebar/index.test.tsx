import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import router from 'next-router-mock'
import { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LayoutSidebar } from './index'
import { LayoutSidebarProvider, SIDEBAR_KEYS } from './LayoutSidebarProvider'
import { sidebarManagerState } from 'state/sidebar-manager-state'

vi.mock('components/ui/AIAssistantPanel/AIAssistant', () => ({
  AIAssistant: () => <div data-testid="ai-assistant-sidebar">AI Assistant</div>,
}))

const resetSidebarManagerState = () => {
  Object.keys(sidebarManagerState.sidebars).forEach((id) => {
    sidebarManagerState.unregisterSidebar(id)
  })
  sidebarManagerState.closeAll()
}

describe('LayoutSidebar', () => {
  let queryClient: QueryClient
  let wrapper: ({ children }: { children: ReactNode }) => ReactNode

  beforeEach(() => {
    queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    router.setCurrentUrl('/')
  })

  afterEach(() => {
    resetSidebarManagerState()
    queryClient.clear()
    localStorage.clear()
    vi.clearAllMocks()
    router.setCurrentUrl('/')
  })

  const renderSidebar = () =>
    render(
      <LayoutSidebarProvider>
        <LayoutSidebar />
      </LayoutSidebarProvider>,
      { wrapper }
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
    router.setCurrentUrl(`/?sidebar=${SIDEBAR_KEYS.AI_ASSISTANT}`)

    renderSidebar()

    await screen.findByTestId('ai-assistant-sidebar')
  })
})
