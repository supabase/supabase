import { SupportCategories } from '@supabase/shared-types/out/constants'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SubmittedSupportRequest } from './SupportForm.state'
import { NO_PROJECT_MARKER } from './SupportForm.utils'
import { SupportAssistantSuccessCardContent as SupportAssistantSuccessCard } from '@/components/ui/AIAssistantPanel/SupportAssistantSuccessCardContent'

const { chatInstances, mockNewChat, mockOpenSidebar, mockSelectChat, mockTrack } = vi.hoisted(
  () => ({
    chatInstances: {} as Record<string, MockChat>,
    mockNewChat: vi.fn(),
    mockOpenSidebar: vi.fn(),
    mockSelectChat: vi.fn(),
    mockTrack: vi.fn(),
  })
)

type MockChat = {
  messages: Array<{ id: string; role: string; parts: Array<{ type: string; text: string }> }>
  '~registerMessagesCallback': ReturnType<typeof vi.fn>
}

vi.mock('streamdown', () => ({
  Streamdown: ({ children }: { children: string }) => (
    <div data-testid="assistant-preview-message">{children}</div>
  ),
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

vi.mock('@/lib/telemetry/track', () => ({
  useTrack: () => mockTrack,
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
  let nextChatMessages: MockChat['messages']
  let emitChatMessagesChange: (() => void) | undefined

  function createMockChat(messages: MockChat['messages'] = []) {
    return {
      messages,
      '~registerMessagesCallback': vi.fn((onStoreChange: () => void) => {
        emitChatMessagesChange = onStoreChange
        return vi.fn()
      }),
    }
  }

  beforeEach(() => {
    Object.keys(chatInstances).forEach((key) => delete chatInstances[key])
    mockNewChat.mockReset()
    mockOpenSidebar.mockReset()
    mockSelectChat.mockReset()
    mockTrack.mockReset()
    nextChatMessages = []
    emitChatMessagesChange = undefined

    mockNewChat.mockImplementation(() => {
      chatInstances['chat-1'] = createMockChat(nextChatMessages)
      return 'chat-1'
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
    const { container } = render(<SupportAssistantSuccessCard request={supportRequest} />)

    expect(await screen.findByRole('heading', { name: 'While you wait' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open assistant response/i })).toBeInTheDocument()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders the full assistant response preview inside the clipped content area', async () => {
    const longResponse = 'A'.repeat(500)
    nextChatMessages = [
      {
        id: 'assistant-message',
        role: 'assistant',
        parts: [{ type: 'text', text: longResponse }],
      },
    ]

    render(<SupportAssistantSuccessCard request={supportRequest} />)

    const preview = await screen.findByTestId('assistant-preview-message')
    expect(preview).toHaveTextContent(longResponse)
    expect(preview.closest('[class*="max-h-48"]')).toHaveClass('overflow-hidden')
  })

  it('updates the preview when the shared chat receives an assistant message', async () => {
    render(<SupportAssistantSuccessCard request={supportRequest} />)

    await waitFor(() => {
      expect(chatInstances['chat-1']?.['~registerMessagesCallback']).toHaveBeenCalled()
    })

    act(() => {
      chatInstances['chat-1'].messages = [
        {
          id: 'assistant-message',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Try checking the API logs first.' }],
        },
      ]
      emitChatMessagesChange?.()
    })

    expect(await screen.findByTestId('assistant-preview-message')).toHaveTextContent(
      'Try checking the API logs first.'
    )
  })

  it('opens the generated assistant chat when the action is clicked', async () => {
    const user = userEvent.setup()
    render(<SupportAssistantSuccessCard request={supportRequest} />)

    const button = await screen.findByRole('button', { name: /open assistant response/i })
    await user.click(button)

    expect(mockTrack).toHaveBeenCalledWith(
      'support_assistant_follow_up_card_clicked',
      { ticketCategory: SupportCategories.PROBLEM },
      {
        project: 'project-1',
        organization: 'org-1',
      }
    )
    expect(mockSelectChat).toHaveBeenCalledWith('chat-1')
    expect(mockOpenSidebar).toHaveBeenCalledWith('ai-assistant')
  })

  it('opens the generated assistant chat with keyboard activation', async () => {
    const user = userEvent.setup()
    render(<SupportAssistantSuccessCard request={supportRequest} />)

    const button = await screen.findByRole('button', { name: /open assistant response/i })
    button.focus()
    await user.keyboard('{Enter}')

    expect(mockSelectChat).toHaveBeenCalledWith('chat-1')
    expect(mockOpenSidebar).toHaveBeenCalledWith('ai-assistant')
  })

  it('does not render or create a chat when no project is selected', () => {
    render(
      <SupportAssistantSuccessCard
        request={{ ...supportRequest, projectRef: NO_PROJECT_MARKER, organizationSlug: 'org-1' }}
      />
    )

    expect(screen.queryByText(/assistant response/i)).not.toBeInTheDocument()
    expect(mockNewChat).not.toHaveBeenCalled()
  })
})
