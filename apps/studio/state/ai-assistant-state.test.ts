import { proxy, ref } from 'valtio/vanilla'
import { describe, expect, it } from 'vitest'

import { sanitizeForCloning } from './ai-assistant-state'

describe('AI assistant chat message sync', () => {
  // Regression test for FE-3954: clicking Skip/Run Query silently did nothing.
  //
  // valtio's proxy() does not clone its input — it mutates the object's own nested
  // properties in place when wrapping it. Assigning the AI SDK Chat instance's live
  // message array directly into valtio state therefore corrupted that same array with
  // Proxies. The AI SDK's own addToolApprovalResponse later calls structuredClone() on
  // the last message, which throws on a Proxy — an unhandled rejection that aborted
  // before any state update or network request, so approval buttons appeared inert.
  it('does not corrupt the live SDK message array when synced into valtio state', () => {
    const state = proxy<{ chats: Record<string, any>; chatInstances: Record<string, any> }>({
      chats: {},
      chatInstances: {},
    })
    state.chats['chat-1'] = { id: 'chat-1', messages: [] }

    // Shape mirrors a real assistant message: a text part precedes the tool call, so it
    // passes through addToolApprovalResponse's part-matching logic untouched.
    const liveSdkMessages = [
      {
        id: 'message-1',
        role: 'assistant',
        parts: [
          { type: 'text', text: "Sure, here's a query" },
          {
            type: 'tool-execute_sql',
            toolCallId: 'tool-1',
            state: 'approval-requested',
            approval: { id: 'approval-1' },
          },
        ],
      },
    ]
    state.chatInstances['chat-1'] = ref({ messages: liveSdkMessages })

    const chat = state.chats['chat-1']
    chat.messages = liveSdkMessages.map((message) => sanitizeForCloning(message))

    // The exact operation the AI SDK's addToolApprovalResponse performs on click.
    const lastMessage = liveSdkMessages[liveSdkMessages.length - 1]
    const updatedParts = lastMessage.parts.map((part: any) =>
      part.state === 'approval-requested' && part.approval?.id === 'approval-1'
        ? { ...part, state: 'approval-responded', approval: { id: 'approval-1', approved: true } }
        : part
    )
    const replacedMessage = { ...lastMessage, parts: updatedParts }

    expect(() => structuredClone(replacedMessage)).not.toThrow()
  })
})
