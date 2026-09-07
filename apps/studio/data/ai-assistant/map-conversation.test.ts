import { readUIMessageStream, toUIMessageStream, type UIMessage } from 'ai'
import { describe, expect, it, vi } from 'vitest'

import { assistantStreamFixtures } from './fixtures/assistant-streams'
import { parseConversation, parseConversationList } from './map-conversation'

const conversation = {
  id: '11111111-1111-4111-8111-111111111111',
  revision: 1,
  name: 'Chat',
  project_ref: 'project',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}
describe('validated Assistant response adapter', () => {
  it('restores support ticket linkage without leaving synchronization stuck after a reload', async () => {
    const support_metadata = {
      subject: 'Help',
      category: 'database',
      severity: 'normal',
      allowSupportAccess: true,
      frontConversationId: 'ticket',
      isSupportChat: true,
      lifecycleStatus: 'escalated',
      lastSyncedMessageCount: 2,
      isSyncing: true,
      isLifecycleSyncing: true,
    }
    expect(
      await parseConversation({ conversation: { ...conversation, support_metadata } })
    ).toMatchObject({
      supportMetadata: {
        frontConversationId: 'ticket',
        lifecycleStatus: 'escalated',
        isSyncing: false,
        isLifecycleSyncing: false,
      },
    })
  })
  it('unwraps PATCH responses and supports unloaded and empty conversations', async () => {
    expect(await parseConversation({ conversation })).toMatchObject({
      id: conversation.id,
      revision: 1,
      messagesLoaded: false,
    })
    expect(await parseConversation({ conversation, messages: [], nextCursor: 12 })).toMatchObject({
      messages: [],
      messagesLoaded: true,
      nextCursor: 12,
    })
    expect(await parseConversationList({ conversations: [conversation] })).toHaveLength(1)
  })
  it('rejects malformed responses instead of inventing a successful chat', async () => {
    await expect(parseConversation({})).rejects.toThrow()
    await expect(
      parseConversation({ conversation: { ...conversation, revision: undefined } })
    ).rejects.toThrow()
  })
  it.each(assistantStreamFixtures)(
    'consumes the v1 $name protocol in Studio',
    async ({ name, parts }) => {
      const modelStream = new ReadableStream({
        start(controller) {
          ;[{ type: 'start' }, ...parts, { type: 'finish', finishReason: 'stop' }].forEach((part) =>
            controller.enqueue(part)
          )
          controller.close()
        },
      })
      const stream = toUIMessageStream({ stream: modelStream, generateMessageId: () => 'message' })
      let message: UIMessage | undefined
      const errors = vi.fn()
      for await (const update of readUIMessageStream({
        stream,
        onError: errors,
        terminateOnError: false,
      }))
        message = update
      if (name === 'error') {
        expect(errors).toHaveBeenCalled()
        return
      }
      expect(message?.parts.length).toBeGreaterThan(0)
      expect(await parseConversation({ conversation, messages: [message] })).toMatchObject({
        messagesLoaded: true,
      })
      if (name === 'dynamic MCP results') expect(message?.parts[0].type).toBe('dynamic-tool')
    }
  )
})
