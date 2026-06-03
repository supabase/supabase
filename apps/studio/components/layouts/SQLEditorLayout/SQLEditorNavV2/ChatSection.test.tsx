import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChatSection } from './ChatSection'

const push = vi.fn()

let params: { ref?: string; chatId?: string }
let assistantState: AssistantState
let tabsState: TabsState

type TestChat = {
  id: string
  name: string
  messages: []
  createdAt: Date
  updatedAt: Date
}

type AssistantState = {
  isInitialized: boolean
  chats: Record<string, TestChat>
  newChat: ReturnType<typeof vi.fn<() => string>>
  deleteChat: ReturnType<typeof vi.fn<(id: string) => string | undefined>>
  renameChat: ReturnType<typeof vi.fn<(id: string, name: string) => void>>
}

type TabsState = {
  tabsMap: Record<string, { metadata?: { chatId?: string } }>
  previewTabId: string | undefined
  makeTabPermanent: ReturnType<typeof vi.fn<(id: string) => void>>
  removeTab: ReturnType<typeof vi.fn<(id: string) => void>>
  updateTab: ReturnType<typeof vi.fn<(id: string, updates: { label: string }) => void>>
}

vi.mock('common', () => ({
  useParams: () => params,
}))

vi.mock('next/router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('ui', () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(' '),
  ContextMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ContextMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  ContextMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ContextMenuItem: ({ children, onSelect }: { children: ReactNode; onSelect?: () => void }) => (
    <button type="button" onClick={() => onSelect?.()}>
      {children}
    </button>
  ),
  Input: (props: ComponentProps<'input'>) => <input {...props} />,
}))

vi.mock('ui-patterns', () => ({
  InnerSideBarEmptyPanel: ({ title, description }: { title: string; description: ReactNode }) => (
    <div>
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
  InnerSideMenuCollapsible: ({ children }: { children: ReactNode }) => (
    <section>{children}</section>
  ),
  InnerSideMenuCollapsibleContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  InnerSideMenuCollapsibleTrigger: ({ title }: { title: string }) => (
    <button type="button">{title}</button>
  ),
}))

vi.mock('@/components/ui/ButtonTooltip', () => ({
  ButtonTooltip: ({
    onClick,
    'data-testid': testId,
    tooltip,
  }: {
    onClick?: (event: { stopPropagation: () => void }) => void
    'data-testid'?: string
    tooltip?: { content?: { text?: ReactNode } }
  }) => (
    <button type="button" data-testid={testId} onClick={onClick}>
      {tooltip?.content?.text ?? 'Button'}
    </button>
  ),
}))

vi.mock('@/state/ai-assistant-state', () => ({
  useAiAssistantStateSnapshot: () => assistantState,
}))

vi.mock('@/state/tabs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/state/tabs')>()

  return {
    ...actual,
    useTabsStateSnapshot: () => tabsState,
  }
})

const createAssistantState = (overrides?: Partial<AssistantState>): AssistantState => ({
  isInitialized: true,
  chats: {
    older: {
      id: 'older',
      name: 'Older chat',
      messages: [],
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    },
    newer: {
      id: 'newer',
      name: 'Newer chat',
      messages: [],
      createdAt: new Date('2026-01-02T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    },
  },
  newChat: vi.fn(() => 'created'),
  deleteChat: vi.fn(() => 'older'),
  renameChat: vi.fn(),
  ...overrides,
})

describe('ChatSection', () => {
  beforeEach(() => {
    params = { ref: 'default', chatId: 'newer' }
    assistantState = createAssistantState()
    tabsState = {
      tabsMap: {},
      previewTabId: undefined,
      makeTabPermanent: vi.fn(),
      removeTab: vi.fn(),
      updateTab: vi.fn(),
    }
    push.mockReset()
  })

  it('shows loading while assistant state initializes', () => {
    assistantState = createAssistantState({ isInitialized: false, chats: {} })

    render(<ChatSection open onOpenChange={vi.fn()} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows an empty state when there are no chats', () => {
    assistantState = createAssistantState({ chats: {} })

    render(<ChatSection open onOpenChange={vi.fn()} />)

    expect(screen.getByText('No chats')).toBeInTheDocument()
  })

  it('renders chats newest first and navigates on select', () => {
    render(<ChatSection open onOpenChange={vi.fn()} />)

    const newerChat = screen.getByText('Newer chat')
    const olderChat = screen.getByText('Older chat')
    expect(newerChat.compareDocumentPosition(olderChat) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    )

    fireEvent.click(olderChat)

    expect(push).toHaveBeenCalledWith('/project/default/sql/chats/older')
  })

  it('creates a chat and routes to it', () => {
    render(<ChatSection open onOpenChange={vi.fn()} />)

    fireEvent.click(screen.getByTestId('sql-editor-chats-new-button'))

    expect(assistantState.newChat).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/project/default/sql/chats/created')
  })

  it('renames chats and updates the matching tab label', () => {
    render(<ChatSection open onOpenChange={vi.fn()} />)

    fireEvent.click(screen.getAllByText('Rename chat')[0])
    fireEvent.change(screen.getByDisplayValue('Newer chat'), {
      target: { value: 'Renamed chat' },
    })
    fireEvent.blur(screen.getByDisplayValue('Renamed chat'))

    expect(assistantState.renameChat).toHaveBeenCalledWith('newer', 'Renamed chat')
    expect(tabsState.updateTab).toHaveBeenCalledWith('chat-newer', { label: 'Renamed chat' })
  })

  it('deletes chats, removes the tab, and routes active chat deletions to the next chat', () => {
    render(<ChatSection open onOpenChange={vi.fn()} />)

    fireEvent.click(screen.getAllByText('Delete chat')[0])

    expect(assistantState.deleteChat).toHaveBeenCalledWith('newer')
    expect(tabsState.removeTab).toHaveBeenCalledWith('chat-newer')
    expect(push).toHaveBeenCalledWith('/project/default/sql/chats/older')
  })
})
