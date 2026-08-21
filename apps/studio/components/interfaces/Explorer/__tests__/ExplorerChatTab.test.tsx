import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ExplorerChatTab } from '../ExplorerChatTab'
import { customRender } from '@/tests/lib/custom-render'

const mocks = vi.hoisted(() => ({
  createBranch: vi.fn(),
  createChat: vi.fn(),
  ensureChatInstance: vi.fn(),
  handleTabClose: vi.fn(),
  makeTabPermanent: vi.fn(),
  openChat: vi.fn(),
  push: vi.fn(),
  useParams: vi.fn(),
  assistantSnapshot: vi.fn(),
}))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, useParams: () => mocks.useParams() }
})

vi.mock('next/router', () => ({
  useRouter: () => ({ query: { ref: 'default' }, push: mocks.push }),
}))

vi.mock('@/components/interfaces/Explorer/hooks', () => ({
  useCreateChat: () => ({ createChat: mocks.createChat, openChat: mocks.openChat }),
}))

vi.mock('@/state/tabs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/state/tabs')>()
  return {
    ...actual,
    useTabsStateSnapshot: () => ({
      handleTabClose: mocks.handleTabClose,
      makeTabPermanent: mocks.makeTabPermanent,
      openTabs: ['chat-chat-1'],
    }),
  }
})

vi.mock('@/state/ai-assistant-state', () => ({
  useAiAssistantStateSnapshot: () => mocks.assistantSnapshot(),
  useAiAssistantState: () => ({
    createBranch: mocks.createBranch,
    ensureChatInstance: mocks.ensureChatInstance,
  }),
}))

vi.mock('@/state/sidebar-manager-state', () => ({
  useSidebarManagerSnapshot: () => ({ activeSidebar: undefined }),
}))

vi.mock('@/components/ui/AIAssistantPanel/AssistantChat', () => ({
  AssistantChat: ({
    chatId,
    onSelectChat,
    onInputChange,
  }: {
    chatId: string
    onSelectChat: (id: string) => void
    onInputChange?: (value: string) => void
  }) => (
    <>
      <button
        type="button"
        tabIndex={0}
        data-chat-id={chatId}
        onClick={() => onSelectChat('chat-2')}
      >
        Assistant
      </button>
      <textarea aria-label="Chat input" onChange={(e) => onInputChange?.(e.target.value)} />
    </>
  ),
}))

describe('ExplorerChatTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useParams.mockReturnValue({ ref: 'default', id: 'chat-1' })
    mocks.assistantSnapshot.mockReturnValue({
      isInitialized: true,
      chats: { 'chat-1': { id: 'chat-1', name: 'Investigate errors' } },
      chatInstances: { 'chat-1': {} },
    })
  })

  it('renders the routed chat and ensures its instance without changing sidebar selection', () => {
    customRender(<ExplorerChatTab />)

    expect(mocks.ensureChatInstance).toHaveBeenCalledWith('chat-1')
    expect(screen.getByRole('button', { name: 'Assistant' })).toHaveAttribute(
      'data-chat-id',
      'chat-1'
    )
  })

  it('routes shared chat navigation through Explorer', () => {
    customRender(<ExplorerChatTab />)

    fireEvent.click(screen.getByRole('button', { name: 'Assistant' }))

    expect(mocks.openChat).toHaveBeenCalledWith('chat-2')
  })

  it('persists the tab once the user starts typing in the chat input', () => {
    customRender(<ExplorerChatTab />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Chat input' }), {
      target: { value: 'How do I' },
    })

    expect(mocks.makeTabPermanent).toHaveBeenCalledWith('chat-chat-1')
  })

  it('removes an orphaned tab only after chat hydration completes', () => {
    mocks.assistantSnapshot.mockReturnValue({
      isInitialized: true,
      chats: {},
      chatInstances: {},
    })

    customRender(<ExplorerChatTab />)

    expect(screen.getByRole('heading', { name: 'Chat not found' })).toBeVisible()
    expect(mocks.handleTabClose).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'chat-chat-1', editor: 'explorer' })
    )
  })
})
