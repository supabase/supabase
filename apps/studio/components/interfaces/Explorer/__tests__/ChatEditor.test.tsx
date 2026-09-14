import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChatEditor } from '../ChatEditor'
import { customRender } from '@/tests/lib/custom-render'

const mocks = vi.hoisted(() => ({
  addTab: vi.fn(),
  createBranch: vi.fn(),
  createChat: vi.fn(),
  ensureChatInstance: vi.fn(),
  handleTabClose: vi.fn(),
  openChat: vi.fn(),
  push: vi.fn(),
  updateTab: vi.fn(),
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
      addTab: mocks.addTab,
      handleTabClose: mocks.handleTabClose,
      openTabs: ['chat-chat-1'],
      updateTab: mocks.updateTab,
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
  }: {
    chatId: string
    onSelectChat: (id: string) => void
  }) => (
    <button type="button" tabIndex={0} data-chat-id={chatId} onClick={() => onSelectChat('chat-2')}>
      Assistant
    </button>
  ),
}))

describe('ChatEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useParams.mockReturnValue({ ref: 'default', id: 'chat-1' })
    mocks.assistantSnapshot.mockReturnValue({
      isInitialized: true,
      chats: { 'chat-1': { id: 'chat-1', name: 'Investigate errors' } },
      chatInstances: { 'chat-1': {} },
    })
  })

  it('renders and registers the routed chat without changing sidebar selection', () => {
    customRender(<ChatEditor />)

    expect(mocks.ensureChatInstance).toHaveBeenCalledWith('chat-1')
    expect(screen.getByRole('button', { name: 'Assistant' })).toHaveAttribute(
      'data-chat-id',
      'chat-1'
    )
    expect(mocks.addTab).toHaveBeenCalledWith({
      id: 'chat-chat-1',
      type: 'chat',
      label: 'Investigate errors',
      metadata: { chatId: 'chat-1' },
      isPreview: false,
    })
  })

  it('routes shared chat navigation through Explorer', () => {
    customRender(<ChatEditor />)

    fireEvent.click(screen.getByRole('button', { name: 'Assistant' }))

    expect(mocks.openChat).toHaveBeenCalledWith('chat-2')
  })

  it('removes an orphaned tab only after chat hydration completes', () => {
    mocks.assistantSnapshot.mockReturnValue({
      isInitialized: true,
      chats: {},
      chatInstances: {},
    })

    customRender(<ChatEditor />)

    expect(screen.getByRole('heading', { name: 'Chat not found' })).toBeVisible()
    expect(mocks.handleTabClose).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'chat-chat-1', editor: 'explorer' })
    )
  })
})
