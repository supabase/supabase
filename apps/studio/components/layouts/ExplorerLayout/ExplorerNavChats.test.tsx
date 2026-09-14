import { fireEvent, screen } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ExplorerNavChats } from './ExplorerNavChats'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, useParams: () => ({ id: 'recent-chat' }) }
})

vi.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/project/[ref]/explorer/chat/[id]' }),
}))

vi.mock('./ExplorerLayout.constants', () => ({
  ExplorerNavResourceWrapper: ({
    children,
    search,
    setSearch,
  }: PropsWithChildren<{ search: string; setSearch: (value: string) => void }>) => (
    <div>
      <input
        aria-label="Search chats"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {children}
    </div>
  ),
  rowClassName: (isActive: boolean) => (isActive ? 'active' : 'inactive'),
}))

vi.mock('@/components/interfaces/Explorer/hooks', () => ({
  useCreateChat: () => ({ openChat: vi.fn() }),
}))

vi.mock('@/state/ai-assistant-state', () => ({
  useAiAssistantChatList: () => [
    { id: 'old-chat', name: 'Older investigation', updatedAt: new Date('2026-01-01') },
    { id: 'missing-date', name: 'Rehydrated chat' },
    { id: 'recent-chat', name: 'Recent investigation', updatedAt: new Date('2026-02-01') },
    {
      id: 'support',
      name: 'Support conversation',
      updatedAt: new Date('2026-03-01'),
      supportMetadata: { isSupportChat: true },
    },
  ],
}))

describe('ExplorerNavChats', () => {
  it('filters support chats, safely sorts rehydrated chats, and marks the route active', () => {
    customRender(<ExplorerNavChats onBack={vi.fn()} />)

    const chatButtons = screen.getAllByRole('button')
    expect(chatButtons.map((button) => button.textContent)).toEqual([
      'Recent investigation',
      'Older investigation',
      'Rehydrated chat',
    ])
    expect(chatButtons[0]).toHaveClass('active')
    expect(screen.queryByText('Support conversation')).not.toBeInTheDocument()

    fireEvent.change(screen.getByRole('textbox', { name: 'Search chats' }), {
      target: { value: 'rehydrated' },
    })

    expect(screen.getByRole('button')).toHaveTextContent('Rehydrated chat')
    expect(screen.queryByText('Recent investigation')).not.toBeInTheDocument()
  })
})
