import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AIAssistantHeader } from './AIAssistantHeader'
import { customRender } from '@/tests/lib/custom-render'

const { openChat } = vi.hoisted(() => ({ openChat: vi.fn() }))

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
  it('opens the active chat in Explorer and closes the sidebar', () => {
    const onCloseAssistant = vi.fn()
    customRender(<AIAssistantHeader {...defaultProps} onCloseAssistant={onCloseAssistant} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open in Explorer' }))

    expect(openChat).toHaveBeenCalledWith('chat-1')
    expect(onCloseAssistant).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Minimize' })).not.toBeInTheDocument()
  })
})
