import { SupportCategories } from '@supabase/shared-types/out/constants'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SupportAssistantSuccessCard } from './SupportAssistantSuccessCard'
import type { SubmittedSupportRequest } from './SupportForm.state'
import { NO_PROJECT_MARKER } from './SupportForm.utils'

const { chatInstances, mockNewChat, mockOpenSidebar, mockSelectChat, mockTrack, mockUseChat } =
  vi.hoisted(() => ({
    chatInstances: {} as Record<string, unknown>,
    mockNewChat: vi.fn(),
    mockOpenSidebar: vi.fn(),
    mockSelectChat: vi.fn(),
    mockTrack: vi.fn(),
    mockUseChat: vi.fn(),
  }))

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

vi.mock('@/lib/telemetry/track', () => ({
  useTrack: () => mockTrack,
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
    mockTrack.mockReset()
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
    const { container } = render(<SupportAssistantSuccessCard request={supportRequest} />)

    expect(await screen.findByRole('heading', { name: 'While you wait' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open assistant response/i })).toBeInTheDocument()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
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
