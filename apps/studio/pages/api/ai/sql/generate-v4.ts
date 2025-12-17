import pgMeta from '@supabase/pg-meta'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  type ModelMessage,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai'
import { source } from 'common-tags'
import type { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'

import { IS_PLATFORM } from 'common'
import { createAgentMessages } from 'data/agents/agent-messages-create-mutation'
import { getAgentMessages } from 'data/agents/agent-messages-query'
import { executeSql } from 'data/sql/execute-sql-query'
import type { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { cleanMessage } from 'lib/ai/clean-message'
import { getModel } from 'lib/ai/model'
import { getOrgAIDetails } from 'lib/ai/org-ai-details'
import {
  CHAT_PROMPT,
  EDGE_FUNCTION_PROMPT,
  GENERAL_PROMPT,
  LIMITATIONS_PROMPT,
  PG_BEST_PRACTICES,
  REALTIME_PROMPT,
  RLS_PROMPT,
  SECURITY_PROMPT,
} from 'lib/ai/prompts'
import { getTools } from 'lib/ai/tools'
import apiWrapper from 'lib/api/apiWrapper'
import { executeQuery } from 'lib/api/self-hosted/query'

export const maxDuration = 120

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({
        data: null,
        error: { message: `Method ${method} Not Allowed` },
      })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper

const requestBodySchema = z.object({
  message: z.any(), // Single message from the user
  chatId: z.string().uuid().optional(), // Chat session ID
  projectRef: z.string(),
  connectionString: z.string(),
  schema: z.string().optional(),
  table: z.string().optional(),
  chatName: z.string().optional(),
  orgSlug: z.string().optional(),
  model: z.enum(['gpt-5', 'gpt-5-mini']).optional(),
})

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const authorization = req.headers.authorization
  const accessToken = authorization?.replace('Bearer ', '')

  if (IS_PLATFORM && !accessToken) {
    return res.status(401).json({ error: 'Authorization token is required' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { data, error: parseError } = requestBodySchema.safeParse(body)

  if (parseError) {
    return res.status(400).json({ error: 'Invalid request body', issues: parseError.issues })
  }

  const {
    message,
    chatId,
    projectRef,
    connectionString,
    orgSlug,
    chatName,
    model: requestedModel,
  } = data

  // Load previous messages from the database if chatId is provided
  let previousMessages: UIMessage[] = []
  if (chatId && projectRef) {
    try {
      const data = await getAgentMessages({ projectRef, id: chatId }, undefined, {
        ...(authorization && { Authorization: authorization }),
      })
      console.log('Loaded messages from DB:', JSON.stringify(data, null, 2))
      // Clean loaded messages to match UIMessage format expected by AI SDK
      previousMessages = (data || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        parts: msg.parts || [],
        ...(msg.metadata != null && typeof msg.metadata === 'object'
          ? { metadata: msg.metadata }
          : {}),
      })) as UIMessage[]
    } catch (error) {
      console.error('Failed to load previous messages:', error)
      // Continue without previous messages
    }
  }

  const rawMessages = [...previousMessages, message]

  let aiOptInLevel: AiOptInLevel = 'disabled'
  let isLimited = false

  if (!IS_PLATFORM) {
    aiOptInLevel = 'schema'
  }

  if (IS_PLATFORM && orgSlug && authorization && projectRef) {
    try {
      // Get organizations and compute opt in level server-side
      const { aiOptInLevel: orgAIOptInLevel, isLimited: orgAILimited } = await getOrgAIDetails({
        orgSlug,
        authorization,
        projectRef,
      })

      aiOptInLevel = orgAIOptInLevel
      isLimited = orgAILimited
    } catch (error) {
      return res.status(400).json({
        error: 'There was an error fetching your organization details',
      })
    }
  }

  // Use raw messages directly - take last 7 for context window management
  const messagesForModel = rawMessages.slice(-7)
  const originalMessages = rawMessages

  const {
    model,
    error: modelError,
    promptProviderOptions,
    providerOptions,
  } = await getModel({
    provider: 'openai',
    model: requestedModel ?? 'gpt-5',
    routingKey: projectRef,
    isLimited,
  })

  if (modelError) {
    return res.status(500).json({ error: modelError.message })
  }

  try {
    // Get a list of all schemas to add to context
    const pgMetaSchemasList = pgMeta.schemas.list()
    type Schemas = z.infer<(typeof pgMetaSchemasList)['zod']>

    const { result: schemas } =
      aiOptInLevel !== 'disabled'
        ? await executeSql<Schemas>(
            {
              projectRef,
              connectionString,
              sql: pgMetaSchemasList.sql,
            },
            undefined,
            {
              'Content-Type': 'application/json',
              ...(authorization && { Authorization: authorization }),
            },
            IS_PLATFORM ? undefined : executeQuery
          )
        : { result: [] }

    const schemasString =
      schemas?.length > 0
        ? `The available database schema names are: ${JSON.stringify(schemas)}`
        : "You don't have access to any schemas."

    // Important: do not use dynamic content in the system prompt or Bedrock will not cache it
    const system = source`
      ${GENERAL_PROMPT}
      ${CHAT_PROMPT}
      ${PG_BEST_PRACTICES}
      ${RLS_PROMPT}
      ${EDGE_FUNCTION_PROMPT}
      ${REALTIME_PROMPT}
      ${SECURITY_PROMPT}
      ${LIMITATIONS_PROMPT}
    `

    // Note: these must be of type `CoreMessage` to prevent AI SDK from stripping `providerOptions`
    // https://github.com/vercel/ai/blob/81ef2511311e8af34d75e37fc8204a82e775e8c3/packages/ai/core/prompt/standardize-prompt.ts#L83-L88
    const coreMessagesBase: ModelMessage[] = [
      {
        role: 'system',
        content: system,
        ...(promptProviderOptions && {
          providerOptions: promptProviderOptions,
        }),
      },
      {
        role: 'assistant',
        // Add any dynamic context here
        content: `The user's current project is ${projectRef}. Their available schemas are: ${schemasString}. The current chat name is: ${chatName}`,
      },
    ]

    const abortController = new AbortController()
    req.on('close', () => abortController.abort())
    req.on('aborted', () => abortController.abort())

    // Get tools with chat context for server-side tool execution
    const tools = await getTools({
      projectRef,
      connectionString,
      authorization,
      aiOptInLevel,
      accessToken,
      chatId,
    })

    // Skip validation for now - just use raw messages
    // The validateUIMessages is too strict about tool part schemas
    const validatedMessagesForModel = messagesForModel
    const validatedOriginalMessages = originalMessages

    console.log('Messages for model:', JSON.stringify(validatedMessagesForModel, null, 2))

    let coreMessages: ModelMessage[]
    try {
      coreMessages = [...coreMessagesBase, ...convertToModelMessages(validatedMessagesForModel)]
    } catch (error) {
      console.error('convertToModelMessages failed:', error)
      // Fall back to text-only messages if conversion fails
      const textOnlyMessages = validatedMessagesForModel.map((msg) => ({
        id: msg.id,
        role: msg.role,
        parts: msg.parts.filter((part: { type: string }) => part.type === 'text'),
      }))
      console.log('Falling back to text-only messages:', JSON.stringify(textOnlyMessages, null, 2))
      coreMessages = [
        ...coreMessagesBase,
        ...convertToModelMessages(textOnlyMessages as UIMessage[]),
      ]
    }

    // Headers for API calls
    const apiHeaders = {
      'Content-Type': 'application/json',
      ...(authorization && { Authorization: authorization }),
    }

    // Create UI message stream with immediate persistence
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // 1. Save user message BEFORE streaming starts
        const userMessage = message as UIMessage
        if (chatId && projectRef && userMessage.role === 'user') {
          try {
            console.log('Saving user message:', JSON.stringify(userMessage, null, 2))
            await createAgentMessages({ projectRef, id: chatId, messages: [userMessage] }, apiHeaders)
          } catch (error) {
            console.error('Failed to save user message:', error)
            // Continue even if save fails - don't block the streaming
          }
        }

        // 2. Write start events for assistant response (only for user messages)
        if (userMessage.role === 'user') {
          writer.write({ type: 'start', messageId: generateId() })
          writer.write({ type: 'start-step' })
        }

        // 3. Execute streamText and merge output
        const result = streamText({
          model,
          stopWhen: stepCountIs(5),
          messages: coreMessages,
          ...(providerOptions && { providerOptions }),
          tools,
          abortSignal: abortController.signal,
        })

        // Consume the stream to ensure it runs
        result.consumeStream()

        // Merge the stream output (sendStart: false since we already wrote start events)
        writer.merge(result.toUIMessageStream({ sendStart: false, sendReasoning: true }))
      },
      originalMessages: validatedOriginalMessages,
      onFinish: async ({ responseMessage }) => {
        // 4. Save assistant message after streaming completes
        console.log('responseMessage:', JSON.stringify(responseMessage))
        if (chatId && projectRef && responseMessage) {
          try {
            const cleanedMessage = cleanMessage(responseMessage)
            console.log('Saving assistant message:', JSON.stringify(cleanedMessage, null, 2))
            await createAgentMessages({ projectRef, id: chatId, messages: [cleanedMessage] }, apiHeaders)
          } catch (error) {
            console.error('Failed to save assistant message:', error)
          }
        }
      },
      onError: (error) => {
        if (error == null) {
          return 'unknown error'
        }

        if (typeof error === 'string') {
          return error
        }

        if (error instanceof Error) {
          return error.message
        }

        return JSON.stringify(error)
      },
    })

    // Create response from stream
    const uiMessageStreamResponse = createUIMessageStreamResponse({ stream })

    // Stream the response
    res.writeHead(uiMessageStreamResponse.status, {
      'Content-Type': 'text/plain; charset=utf-8',
      ...Object.fromEntries(uiMessageStreamResponse.headers.entries()),
    })

    if (uiMessageStreamResponse.body) {
      const reader = uiMessageStreamResponse.body.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(value)
        }
      } finally {
        reader.releaseLock()
      }
    }

    res.end()
  } catch (error) {
    console.error('Error in handlePost:', error)
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message })
    }
    return res.status(500).json({ message: 'An unexpected error occurred.' })
  }
}
