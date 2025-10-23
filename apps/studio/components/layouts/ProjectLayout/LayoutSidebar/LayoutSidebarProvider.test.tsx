import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getSidebarManagerSnapshot,
  sidebarManagerState,
} from 'state/sidebar-manager-state'
import {
  LayoutSidebarProvider,
  SIDEBAR_KEYS,
} from './LayoutSidebarProvider'

vi.mock('components/ui/AIAssistantPanel/AIAssistant', () => ({
  AIAssistant: () => <div data-testid="ai-assistant-sidebar" />,
}))

const resetSidebarManagerState = () => {
  Object.keys(sidebarManagerState.sidebars).forEach((id) => {
    sidebarManagerState.unregisterSidebar(id)
  })
  sidebarManagerState.closeAll()
}

describe('LayoutSidebarProvider', () => {
  let queryClient: QueryClient
  let wrapper: ({ children }: { children: ReactNode }) => ReactNode

  beforeEach(() => {
    queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  })

  afterEach(() => {
    resetSidebarManagerState()
    queryClient.clear()
    localStorage.clear()
    vi.clearAllMocks()
  })

  const renderWithProviders = () =>
    render(<LayoutSidebarProvider>content</LayoutSidebarProvider>, {
      wrapper,
    })

  it('registers the AI assistant sidebar on mount and unregisters on unmount', async () => {
    const { unmount } = renderWithProviders()

    await waitFor(() => {
      expect(getSidebarManagerSnapshot().sidebars[SIDEBAR_KEYS.AI_ASSISTANT]).toBeDefined()
    })

    unmount()

    await waitFor(() => {
      expect(getSidebarManagerSnapshot().sidebars[SIDEBAR_KEYS.AI_ASSISTANT]).toBeUndefined()
    })
  })

  it('allows toggling the registered sidebar', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(getSidebarManagerSnapshot().sidebars[SIDEBAR_KEYS.AI_ASSISTANT]).toBeDefined()
    })

    act(() => {
      sidebarManagerState.toggleSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    })

    expect(sidebarManagerState.isSidebarOpen(SIDEBAR_KEYS.AI_ASSISTANT)).toBe(true)

    act(() => {
      sidebarManagerState.toggleSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    })

    expect(sidebarManagerState.isSidebarOpen(SIDEBAR_KEYS.AI_ASSISTANT)).toBe(false)
  })

  it('responds to the configured hotkey', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(getSidebarManagerSnapshot().sidebars[SIDEBAR_KEYS.AI_ASSISTANT]).toBeDefined()
    })

    act(() => {
      fireEvent.keyDown(window, { key: 'i', metaKey: true })
    })

    expect(sidebarManagerState.isSidebarOpen(SIDEBAR_KEYS.AI_ASSISTANT)).toBe(true)

    act(() => {
      fireEvent.keyDown(window, { key: 'i', metaKey: true })
    })

    expect(sidebarManagerState.isSidebarOpen(SIDEBAR_KEYS.AI_ASSISTANT)).toBe(false)
  })
})
