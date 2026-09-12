import { fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AIAssistantHeader } from './AIAssistantHeader'
import { customRender } from '@/tests/lib/custom-render'

const { openChat, toggleMaximise, useIsExplorerEnabled } = vi.hoisted(() => ({
  openChat: vi.fn(),
  toggleMaximise: vi.fn(),
  useIsExplorerEnabled: vi.fn(),
}))

vi.mock('@/state/ai-assistant-state', () => ({
  useAiAssistantStateSnapshot: () => ({
    activeChatId: 'chat-1',
    activeChat: { name: 'Investigate errors' },
    renameChat: vi.fn(),
  }),
}))

vi.mock('@/components/interfaces/Explorer/hooks', () => ({
  useCreateChat: () => ({ openChat }),
}))

vi.mock('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  useIsExplorerEnabled,
}))

vi.mock('@/state/sidebar-manager-state', () => ({
  useSidebarManagerSnapshot: () => ({ isMaximised: false, toggleMaximise }),
}))

vi.mock('@/state/shortcuts/useShortcut', () => ({ useShortcut: vi.fn() }))

vi.mock('./AIAssistantChatSelector', () => ({
  AIAssistantChatSelector: () => (
    <button type="button" tabIndex={0}>
      History
    </button>
  ),
}))

vi.mock('./AIAssistantMetadataWarning', () => ({
  AIAssistantMetadataWarning: () => null,
}))

const defaultProps = {
  isChatLoading: false,
  onNewChat: vi.fn(),
  onCloseAssistant: vi.fn(),
  showMetadataWarning: false,
  updatedOptInSinceMCP: true,
  isHipaaProjectDisallowed: false,
  aiOptInLevel: 'full',
}

describe('AIAssistantHeader', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('opens the active chat in Explorer and closes the sidebar when Explorer preview is enabled', () => {
    useIsExplorerEnabled.mockReturnValue(true)
    const onCloseAssistant = vi.fn()
    customRender(<AIAssistantHeader {...defaultProps} onCloseAssistant={onCloseAssistant} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open in Explorer' }))

    expect(openChat).toHaveBeenCalledWith('chat-1')
    expect(onCloseAssistant).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Minimize' })).not.toBeInTheDocument()
  })

  it('shows a Maximize CTA that toggles the sidebar when Explorer preview is disabled', () => {
    useIsExplorerEnabled.mockReturnValue(false)
    const onCloseAssistant = vi.fn()
    customRender(<AIAssistantHeader {...defaultProps} onCloseAssistant={onCloseAssistant} />)

    expect(screen.queryByRole('button', { name: 'Open in Explorer' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Maximize' }))

    expect(toggleMaximise).toHaveBeenCalledOnce()
    expect(openChat).not.toHaveBeenCalled()
    expect(onCloseAssistant).not.toHaveBeenCalled()
  })
})
