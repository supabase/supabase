import { SupportCategories } from '@supabase/shared-types/out/constants'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SubmittedSupportRequest } from './SupportForm.state'
import { NO_PROJECT_MARKER } from './SupportForm.utils'
import { SupportAssistantSuccessCardContent as SupportAssistantSuccessCard } from '@/components/ui/AIAssistantPanel/SupportAssistantSuccessCardContent'
import type { components } from '@/data/api'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse']

const {
  chatInstances,
  chats,
  mockNewChat,
  mockOpenSidebar,
  mockSelectChat,
  mockSetContext,
  mockSyncSupportChatToFront,
  mockTrack,
} = vi.hoisted(() => ({
  chatInstances: {} as Record<string, MockChat>,
  chats: {} as Record<string, { messages: unknown[]; supportMetadata?: unknown }>,
  mockNewChat: vi.fn(),
  mockOpenSidebar: vi.fn(),
  mockSelectChat: vi.fn(),
  mockSetContext: vi.fn(),
  mockSyncSupportChatToFront: vi.fn(),
  mockTrack: vi.fn(),
}))

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
  useAiAssistantState: () => ({
    chats,
    selectChat: mockSelectChat,
    setContext: mockSetContext,
  }),
}))

vi.mock('@/state/ai-chat-front-sync', () => ({
  syncSupportChatToFront: mockSyncSupportChatToFront,
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
  threadRef: 'thread-ref-1',
  frontConversationId: 'front-conversation-1',
}

// A minimal but contract-accurate ProjectDetailResponse, so a mock drifting
// from the OpenAPI shape (missing fields, stale enum values) fails to compile.
const readyProjectDetail: ProjectDetailResponse = {
  id: 1,
  ref: 'project-1',
  name: 'Project 1',
  organization_id: 1,
  cloud_provider: 'AWS',
  connectionString: 'postgresql://postgres:postgres@db.project-1.example.com:5432/postgres',
  db_host: 'db.project-1.example.com',
  high_availability: false,
  inserted_at: new Date(0).toISOString(),
  integration_source: null,
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  region: 'us-east-1',
  restUrl: 'https://project-1.example.com/rest',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: new Date(0).toISOString(),
}

function mockProjectDetail(response: ProjectDetailResponse) {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () => HttpResponse.json<ProjectDetailResponse>(response),
  })
}

function mockProjectDetailError() {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () =>
      HttpResponse.json<APIErrorBody>({ message: 'Failed to load project' }, { status: 500 }),
  })
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
    Object.keys(chats).forEach((key) => delete chats[key])
    mockNewChat.mockReset()
    mockOpenSidebar.mockReset()
    mockSelectChat.mockReset()
    mockSetContext.mockReset()
    mockSyncSupportChatToFront.mockReset()
    mockTrack.mockReset()
    nextChatMessages = []
    emitChatMessagesChange = undefined

    mockNewChat.mockImplementation(() => {
      chatInstances['chat-1'] = createMockChat(nextChatMessages)
      chats['chat-1'] = { messages: nextChatMessages }
      return 'chat-1'
    })

    mockProjectDetail(readyProjectDetail)
  })

  it('creates an assistant chat with the submitted support request', async () => {
    customRender(<SupportAssistantSuccessCard request={supportRequest} />)

    await waitFor(() => {
      expect(mockNewChat).toHaveBeenCalledTimes(1)
    })

    expect(mockSetContext).toHaveBeenCalledWith({
      projectRef: 'project-1',
      orgSlug: 'org-1',
      connectionString: readyProjectDetail.connectionString,
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

  it('does not create a chat while the project is still coming up', async () => {
    mockProjectDetail({ ...readyProjectDetail, status: 'COMING_UP', connectionString: null })

    customRender(<SupportAssistantSuccessCard request={supportRequest} />)

    await screen.findByRole('heading', { name: 'While you wait' })
    expect(mockNewChat).not.toHaveBeenCalled()
    // Not interactive yet either - no chat has been created for the card to open
    expect(
      screen.queryByRole('button', { name: /open assistant response/i })
    ).not.toBeInTheDocument()
  })

  it('shows a retry state when the project details request fails, and recovers on retry', async () => {
    mockProjectDetailError()

    const user = userEvent.setup()
    customRender(<SupportAssistantSuccessCard request={supportRequest} />)

    const retryButton = await screen.findByRole('button', { name: 'Try again' })
    expect(mockNewChat).not.toHaveBeenCalled()
    // The card itself has no chat yet, so it must not be interactive
    expect(
      screen.queryByRole('button', { name: /open assistant response/i })
    ).not.toBeInTheDocument()

    mockProjectDetail(readyProjectDetail)
    await user.click(retryButton)

    await waitFor(() => {
      expect(mockNewChat).toHaveBeenCalledTimes(1)
    })
  })

  it('shows a loading preview before the assistant responds', async () => {
    const { container } = customRender(<SupportAssistantSuccessCard request={supportRequest} />)

    expect(await screen.findByRole('heading', { name: 'While you wait' })).toBeInTheDocument()
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

    customRender(<SupportAssistantSuccessCard request={supportRequest} />)

    const preview = await screen.findByTestId('assistant-preview-message')
    expect(preview).toHaveTextContent(longResponse)
    expect(preview.closest('[class*="max-h-48"]')).toHaveClass('overflow-hidden')
  })

  it('updates the preview when the shared chat receives an assistant message', async () => {
    customRender(<SupportAssistantSuccessCard request={supportRequest} />)

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
    customRender(<SupportAssistantSuccessCard request={supportRequest} />)

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

  it('tags the chat as a support chat and syncs it to Front on first open', async () => {
    const user = userEvent.setup()
    customRender(<SupportAssistantSuccessCard request={supportRequest} />)

    const button = await screen.findByRole('button', { name: /open assistant response/i })
    await user.click(button)

    expect(chats['chat-1'].supportMetadata).toMatchObject({
      isSupportChat: true,
      lifecycleStatus: 'bot_active',
      subject: 'API requests fail',
      category: SupportCategories.PROBLEM,
      severity: 'Normal',
      organizationSlug: 'org-1',
      projectRef: 'project-1',
      allowSupportAccess: true,
      threadRef: 'thread-ref-1',
      frontConversationId: 'front-conversation-1',
      lastSyncedMessageCount: 0,
      isSyncing: false,
      isLifecycleSyncing: false,
    })
    // A database credential must never be persisted onto the chat's stored metadata
    expect(chats['chat-1'].supportMetadata).not.toHaveProperty('connectionString')

    // The initial flush is behind a dynamic import, so it lands asynchronously
    await waitFor(() => {
      expect(mockSyncSupportChatToFront).toHaveBeenCalledWith(
        'chat-1',
        expect.objectContaining({ chats })
      )
    })

    // A second open must not re-tag the chat or trigger another initial flush
    const taggedMetadata = chats['chat-1'].supportMetadata
    await user.click(button)

    await waitFor(() => {
      expect(mockSelectChat).toHaveBeenCalledTimes(2)
    })
    expect(chats['chat-1'].supportMetadata).toBe(taggedMetadata)
    expect(mockSyncSupportChatToFront).toHaveBeenCalledTimes(1)
  })

  it('opens the generated assistant chat with keyboard activation', async () => {
    const user = userEvent.setup()
    customRender(<SupportAssistantSuccessCard request={supportRequest} />)

    const button = await screen.findByRole('button', { name: /open assistant response/i })
    button.focus()
    await user.keyboard('{Enter}')

    expect(mockSelectChat).toHaveBeenCalledWith('chat-1')
    expect(mockOpenSidebar).toHaveBeenCalledWith('ai-assistant')
  })

  it('does not render or create a chat when no project is selected', () => {
    customRender(
      <SupportAssistantSuccessCard
        request={{ ...supportRequest, projectRef: NO_PROJECT_MARKER, organizationSlug: 'org-1' }}
      />
    )

    expect(screen.queryByText(/assistant response/i)).not.toBeInTheDocument()
    expect(mockNewChat).not.toHaveBeenCalled()
  })
})
