import { SupportCategories } from '@supabase/shared-types/out/constants'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SupportAssistantSuccessCard } from './SupportAssistantSuccessCard'
import type { SubmittedSupportRequest } from './SupportForm.state'

const { chatInstances, mockNewChat, mockOpenSidebar, mockSelectChat, mockUseChat } = vi.hoisted(
  () => ({
    chatInstances: {} as Record<string, unknown>,
    mockNewChat: vi.fn(),
    mockOpenSidebar: vi.fn(),
    mockSelectChat: vi.fn(),
    mockUseChat: vi.fn(),
  })
)

vi.mock('@ai-sdk/react', () => ({
  useChat: mockUseChat,
}))

vi.mock('ai', () => ({
  lastAssistantMessageIsCompleteWithToolCalls: vi.fn(),
}))

vi.mock('@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider', () => ({
  SIDEBAR_KEYS: {
    AI_ASSISTANT: 'ai-assistant',
  },
}))

vi.mock('@/state/ai-assistant-state', () => ({
  useAiAssistantStateSnapshot: () => ({
    chatInstances,
    newChat: mockNewChat,
    selectChat: mockSelectChat,
  }),
}))

vi.mock('@/state/sidebar-manager-state', () => ({
  useSidebarManagerSnapshot: () => ({
    openSidebar: mockOpenSidebar,
  }),
}))

vi.mock('@/components/ui/AIAssistantPanel/Message', () => ({
  Message: ({ message }: { message: { parts?: Array<{ type: string; text?: string }> } }) => (
    <div data-testid="assistant-preview-message">
      {message.parts
        ?.filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('')}
    </div>
  ),
}))

const supportRequest: SubmittedSupportRequest = {
  organizationSlug: 'org-1',
  projectRef: 'project-1',
  category: SupportCategories.PROBLEM,
  severity: 'Normal',
  subject: 'API requests fail',
  message: 'Requests fail with 500s',
  affectedServices: 'api',
  library: 'javascript',
  allowSupportAccess: true,
  dashboardLogs: undefined,
}

describe('SupportAssistantSuccessCard', () => {
  beforeEach(() => {
    Object.keys(chatInstances).forEach((key) => delete chatInstances[key])
    mockNewChat.mockReset()
    mockOpenSidebar.mockReset()
    mockSelectChat.mockReset()
    mockUseChat.mockReset()

    mockNewChat.mockImplementation(() => {
      chatInstances['chat-1'] = { id: 'chat-1' }
      return 'chat-1'
    })
    mockUseChat.mockReturnValue({
      messages: [],
      status: 'submitted',
    })
  })

  it('creates an assistant chat with the submitted support request', async () => {
    render(<SupportAssistantSuccessCard request={supportRequest} />)

    await waitFor(() => {
      expect(mockNewChat).toHaveBeenCalledTimes(1)
    })

    expect(mockNewChat).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Support request',
        initialMessage: expect.stringContaining('<support>'),
      })
    )
    expect(mockNewChat.mock.calls[0]?.[0].initialMessage).toContain(
      'A support request has already been submitted'
    )
  })

  it('shows a loading preview before the assistant responds', async () => {
    render(<SupportAssistantSuccessCard request={supportRequest} />)

    expect(await screen.findByText('Assistant is reviewing your request...')).toBeInTheDocument()
  })

  it('renders a truncated assistant response preview', async () => {
    const longResponse = 'A'.repeat(500)
    mockUseChat.mockReturnValue({
      messages: [
        {
          id: 'assistant-message',
          role: 'assistant',
          parts: [{ type: 'text', text: longResponse }],
        },
      ],
      status: 'streaming',
    })

    render(<SupportAssistantSuccessCard request={supportRequest} />)

    const preview = await screen.findByTestId('assistant-preview-message')
    expect(preview).toHaveTextContent(`${'A'.repeat(420)}...`)
    expect(preview).not.toHaveTextContent('A'.repeat(421))
  })

  it('opens the generated assistant chat when clicked', async () => {
    const user = userEvent.setup()
    render(<SupportAssistantSuccessCard request={supportRequest} />)

    const card = await screen.findByRole('button', { name: /assistant is checking too/i })
    await user.click(card)

    expect(mockSelectChat).toHaveBeenCalledWith('chat-1')
    expect(mockOpenSidebar).toHaveBeenCalledWith('ai-assistant')
  })

  it('opens the generated assistant chat with keyboard activation', async () => {
    const user = userEvent.setup()
    render(<SupportAssistantSuccessCard request={supportRequest} />)

    const card = await screen.findByRole('button', { name: /assistant is checking too/i })
    card.focus()
    await user.keyboard('{Enter}')

    expect(mockSelectChat).toHaveBeenCalledWith('chat-1')
    expect(mockOpenSidebar).toHaveBeenCalledWith('ai-assistant')
  })
})
