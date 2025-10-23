import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import Router from 'next/router'
import { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  LayoutSidebarProvider,
  SIDEBAR_KEYS,
} from './LayoutSidebarProvider'
import { LayoutSidebar } from './index'
import { sidebarManagerState } from 'state/sidebar-manager-state'

vi.mock('components/ui/AIAssistantPanel/AIAssistant', () => ({
  AIAssistant: () => <div data-testid="ai-assistant-sidebar">AI Assistant</div>,
}))

vi.mock('next/router', async () => {
  const actual = await vi.importActual<typeof import('next/router')>('next/router')
  return {
    ...actual,
    useRouter: () => Router,
  }
})

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

    Object.assign(Router, {
      isReady: true,
      query: {},
      events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      pathname: '/',
      route: '/',
      asPath: '/',
      basePath: '',
      back: vi.fn(),
      beforePopState: vi.fn(),
      reload: vi.fn(),
    })
  })

  afterEach(() => {
    resetSidebarManagerState()
    queryClient.clear()
    localStorage.clear()
    vi.clearAllMocks()
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
    Object.assign(Router, { isReady: true, query: { sidebar: SIDEBAR_KEYS.AI_ASSISTANT } })

    renderSidebar()

    await screen.findByTestId('ai-assistant-sidebar')
  })
})
