import { SupportCategories } from '@supabase/shared-types/out/constants'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIAssistant } from './AIAssistant'
import {
  ASSISTANT_HANDOFF_QUERY_PARAM,
  encodeAssistantHandoff,
} from '@/components/interfaces/Support/SupportAssistant.utils'
import type { SubmittedSupportRequest } from '@/components/interfaces/Support/SupportForm.state'

const {
  chats,
  mockNewChat,
  mockSelectChat,
  mockRouterReplace,
  mockSyncSupportChatToFront,
  routerQuery,
  routeRef,
} = vi.hoisted(() => ({
  chats: {} as Record<string, { supportMetadata?: unknown }>,
  mockNewChat: vi.fn(),
  mockSelectChat: vi.fn(),
  mockRouterReplace: vi.fn(),
  mockSyncSupportChatToFront: vi.fn(),
  routerQuery: {} as Record<string, string>,
  routeRef: { current: 'project-a' as string | undefined },
}))

vi.mock('next/router', () => ({
  useRouter: () => ({
    query: routerQuery,
    pathname: '/project/[ref]',
    replace: mockRouterReplace,
  }),
}))

vi.mock('common/hooks', () => ({
  useParams: () => ({ id: undefined, source: undefined, ref: routeRef.current }),
}))

vi.mock('@/state/ai-assistant-state', () => ({
  useAiAssistantStateSnapshot: () => ({
    activeChatId: undefined,
    isInitialized: true,
    initialInput: '',
    sqlSnippets: undefined,
    suggestions: undefined,
  }),
  useAiAssistantState: () => ({
    chats,
    newChat: mockNewChat,
    selectChat: mockSelectChat,
    branchChat: vi.fn(),
    setSqlSnippets: vi.fn(),
    clearSqlSnippets: vi.fn(),
    sqlSnippets: undefined,
  }),
}))

vi.mock('@/state/ai-chat-front-sync', () => ({
  syncSupportChatToFront: mockSyncSupportChatToFront,
}))

vi.mock('@/state/sql-editor/sql-editor-state', () => ({
  useSqlEditorV2StateSnapshot: () => ({ snippets: {} }),
}))

vi.mock('@/state/sidebar-manager-state', () => ({
  useSidebarManagerSnapshot: () => ({ activeSidebar: undefined, closeSidebar: vi.fn() }),
}))

vi.mock('@/state/shortcuts/useShortcut', () => ({
  useShortcut: () => {},
}))

vi.mock('./AssistantChat', () => ({
  AssistantChat: () => null,
}))

const supportRequest: SubmittedSupportRequest = {
  organizationSlug: 'org-1',
  projectRef: 'project-a',
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

describe('AIAssistant handoff', () => {
  beforeEach(() => {
    Object.keys(routerQuery).forEach((key) => delete routerQuery[key])
    Object.keys(chats).forEach((key) => delete chats[key])
    mockNewChat.mockReset()
    mockSelectChat.mockReset()
    mockRouterReplace.mockReset()
    mockSyncSupportChatToFront.mockReset()
    routeRef.current = 'project-a'

    mockNewChat.mockImplementation(() => {
      chats['chat-1'] = {}
      return 'chat-1'
    })
  })

  it('creates and selects the chat when the handoff project matches the route', async () => {
    routerQuery[ASSISTANT_HANDOFF_QUERY_PARAM] = decodeURIComponent(
      encodeAssistantHandoff(supportRequest)
    )

    render(<AIAssistant />)

    await waitFor(() => {
      expect(mockNewChat).toHaveBeenCalledTimes(1)
    })

    expect(mockSelectChat).toHaveBeenCalledWith('chat-1')
    expect(chats['chat-1'].supportMetadata).toMatchObject({
      projectRef: 'project-a',
      isSupportChat: true,
    })
    expect(mockRouterReplace).toHaveBeenCalledWith(
      { pathname: '/project/[ref]', query: {} },
      undefined,
      { shallow: true }
    )
  })

  it('does not create a chat when the handoff project does not match the route', async () => {
    routeRef.current = 'project-b'
    routerQuery[ASSISTANT_HANDOFF_QUERY_PARAM] = decodeURIComponent(
      encodeAssistantHandoff(supportRequest)
    )

    render(<AIAssistant />)

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledTimes(1)
    })

    expect(mockNewChat).not.toHaveBeenCalled()
    expect(mockSelectChat).not.toHaveBeenCalled()
  })

  it('does nothing when there is no handoff param', () => {
    render(<AIAssistant />)

    expect(mockNewChat).not.toHaveBeenCalled()
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })
})
