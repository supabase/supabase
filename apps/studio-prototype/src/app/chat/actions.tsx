import { Message, TextStreamMessage } from '@/src/components/chat/message'
import { openai } from '@ai-sdk/openai'
import { CoreMessage, generateId } from 'ai'
import { createAI, createStreamableValue, getMutableAIState, streamUI } from 'ai/rsc'
import { ReactNode } from 'react'
import { z } from 'zod'
import { CameraView } from '@/src/components/chat/camera-view'
import { HubView } from '@/src/components/chat/hub-view'
import { UsageView } from '@/src/components/chat/usage-view'
import { DatabaseStatsView } from '@/src/components/chat/data-stats-view'

export interface Hub {
  climate: Record<'low' | 'high', number>
  lights: Array<{ name: string; status: boolean }>
  locks: Array<{ name: string; isLocked: boolean }>
}

let hub: Hub = {
  climate: {
    low: 23,
    high: 25,
  },
  lights: [
    { name: 'patio', status: true },
    { name: 'kitchen', status: false },
    { name: 'garage', status: true },
  ],
  locks: [{ name: 'back door', isLocked: true }],
}

const sendMessage = async (message: string) => {
  'use server'

  const messages = getMutableAIState<typeof AI>('messages')

  messages.update([...(messages.get() as CoreMessage[]), { role: 'user', content: message }])

  const contentStream = createStreamableValue('')
  const textComponent = <TextStreamMessage content={contentStream.value} />

  const { value: stream } = await streamUI({
    model: openai('gpt-4o'),
    system: `\
      - you are a friendly home automation assistant
      - reply in lower case
    `,
    messages: messages.get() as CoreMessage[],
    text: async function* ({ content, done }) {
      if (done) {
        messages.done([...(messages.get() as CoreMessage[]), { role: 'assistant', content }])

        contentStream.done()
      } else {
        contentStream.update(content)
      }

      return textComponent
    },
    tools: {
      viewCameras: {
        description: 'view current active cameras',
        parameters: z.object({}),
        generate: async function* ({}) {
          const toolCallId = generateId()

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: 'assistant',
              content: [
                {
                  type: 'tool-call',
                  toolCallId,
                  toolName: 'viewCameras',
                  args: {},
                },
              ],
            },
            {
              role: 'tool',
              content: [
                {
                  type: 'tool-result',
                  toolName: 'viewCameras',
                  toolCallId,
                  result: `The active cameras are currently displayed on the screen`,
                },
              ],
            },
          ])

          return <Message role="assistant" content={<CameraView />} />
        },
      },
      viewHub: {
        description:
          'view the hub that contains current quick summary and actions for temperature, lights, and locks',
        parameters: z.object({}),
        generate: async function* ({}) {
          const toolCallId = generateId()

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: 'assistant',
              content: [
                {
                  type: 'tool-call',
                  toolCallId,
                  toolName: 'viewHub',
                  args: {},
                },
              ],
            },
            {
              role: 'tool',
              content: [
                {
                  type: 'tool-result',
                  toolName: 'viewHub',
                  toolCallId,
                  result: hub,
                },
              ],
            },
          ])

          return <Message role="assistant" content={<HubView hub={hub} />} />
        },
      },
      updateHub: {
        description: 'update the hub with new values',
        parameters: z.object({
          hub: z.object({
            climate: z.object({
              low: z.number(),
              high: z.number(),
            }),
            lights: z.array(z.object({ name: z.string(), status: z.boolean() })),
            locks: z.array(z.object({ name: z.string(), isLocked: z.boolean() })),
          }),
        }),
        generate: async function* ({ hub: newHub }) {
          hub = newHub
          const toolCallId = generateId()

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: 'assistant',
              content: [
                {
                  type: 'tool-call',
                  toolCallId,
                  toolName: 'updateHub',
                  args: { hub },
                },
              ],
            },
            {
              role: 'tool',
              content: [
                {
                  type: 'tool-result',
                  toolName: 'updateHub',
                  toolCallId,
                  result: `The hub has been updated with the new values`,
                },
              ],
            },
          ])

          return <Message role="assistant" content={<HubView hub={hub} />} />
        },
      },
      viewUsage: {
        description: 'view current usage for electricity, water, or gas',
        parameters: z.object({
          type: z.enum(['electricity', 'water', 'gas']),
        }),
        generate: async function* ({ type }) {
          const toolCallId = generateId()

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: 'assistant',
              content: [
                {
                  type: 'tool-call',
                  toolCallId,
                  toolName: 'viewUsage',
                  args: { type },
                },
              ],
            },
            {
              role: 'tool',
              content: [
                {
                  type: 'tool-result',
                  toolName: 'viewUsage',
                  toolCallId,
                  result: `The current usage for ${type} is currently displayed on the screen`,
                },
              ],
            },
          ])

          return <Message role="assistant" content={<UsageView type={type} />} />
        },
      },
      viewDatabaseStats: {
        description: 'view database stats',
        parameters: z.object({
          type: z.enum(['postgres', 'mysql']),
        }),
        generate: async function* ({ type }) {
          const toolCallId = generateId()

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: 'assistant',
              content: [
                {
                  type: 'tool-call',
                  toolCallId,
                  toolName: 'viewDatabaseStats',
                  args: { type },
                },
              ],
            },
            {
              role: 'tool',
              content: [
                {
                  type: 'tool-result',
                  toolName: 'viewUsage',
                  toolCallId,
                  result: `The current usage for ${type} is currently displayed on the screen`,
                },
              ],
            },
          ])

          return <Message role="assistant" content={<DatabaseStatsView type={type} />} />
        },
      },
    },
  })

  return stream
}

export type UIState = Array<ReactNode>

export type AIState = {
  chatId: string
  messages: Array<CoreMessage>
}

export const AI = createAI<AIState, UIState>({
  initialAIState: {
    chatId: generateId(),
    messages: [],
  },
  initialUIState: [],
  actions: {
    sendMessage,
  },
  onSetAIState: async ({ state, done }) => {
    'use server'

    if (done) {
      // save to database
    }
  },
})
