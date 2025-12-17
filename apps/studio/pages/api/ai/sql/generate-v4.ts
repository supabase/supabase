import pgMeta from '@supabase/pg-meta'
import {
  convertToModelMessages,
  createIdGenerator,
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
import { sanitizeMessagePart } from 'lib/ai/tools/tool-sanitizer'
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
  chatId: z.string().uuid().optional(), // Chat session ID for persistence
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

  // Headers for API calls
  const apiHeaders = {
    'Content-Type': 'application/json',
    ...(authorization && { Authorization: authorization }),
  }

  // Load previous messages from the database if chatId is provided
  let previousMessages: UIMessage[] = []
  if (chatId && projectRef) {
    try {
      previousMessages = await getAgentMessages({ projectRef, id: chatId }, undefined, apiHeaders)
    } catch (error) {
      console.error('Failed to load previous messages:', error)
      // Continue without previous messages
    }
  }

  // Combine previous messages with new message
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

  // Only returns last 7 messages
  // Filters out tools with invalid states
  // Filters out tool outputs based on opt-in level using sanitizeMessagePart
  const messages = (rawMessages || []).slice(-7).map((msg: any) => {
    if (msg && msg.role === 'assistant' && 'results' in msg) {
      const cleanedMsg = { ...msg }
      delete cleanedMsg.results
      return cleanedMsg
    }
    if (msg && msg.role === 'assistant' && msg.parts) {
      const cleanedParts = msg.parts
        .filter((part: any) => {
          if (part.type.startsWith('tool-')) {
            const invalidStates = ['input-streaming', 'input-available', 'output-error']
            return !invalidStates.includes(part.state)
          }
          return true
        })
        .map((part: any) => {
          return sanitizeMessagePart(part, aiOptInLevel)
        })
      return { ...msg, parts: cleanedParts }
    }
    return msg
  })

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
    const coreMessages: ModelMessage[] = [
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
      ...convertToModelMessages(messages),
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

    // Save user message before streaming starts (if persistence is enabled)
    const userMessage = message as UIMessage
    if (chatId && projectRef && userMessage.role === 'user') {
      try {
        await createAgentMessages({ projectRef, id: chatId, messages: [userMessage] }, apiHeaders)
      } catch (error) {
        console.error('Failed to save user message:', error)
        // Continue even if save fails - don't block the streaming
      }
    }

    const result = streamText({
      model,
      stopWhen: stepCountIs(5),
      messages: coreMessages,
      ...(providerOptions && { providerOptions }),
      tools,
      abortSignal: abortController.signal,
    })

    // Consume the stream to ensure it runs to completion & triggers onFinish
    // even when the client response is aborted
    result.consumeStream()

    result.pipeUIMessageStreamToResponse(res, {
      sendReasoning: true,
      // Generate server-side IDs for persistence
      generateMessageId: createIdGenerator({ prefix: 'msg', size: 16 }),
      originalMessages: rawMessages,
      onFinish: async ({ messages: updatedMessages }) => {
        // Save assistant message after streaming completes
        if (chatId && projectRef) {
          try {
            // Get the last message (the new assistant response)
            const assistantMessage = updatedMessages[updatedMessages.length - 1]
            if (assistantMessage && assistantMessage.role === 'assistant') {
              const cleanedMessage = cleanMessage(assistantMessage)
              await createAgentMessages(
                { projectRef, id: chatId, messages: [cleanedMessage] },
                apiHeaders
              )
            }
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
  } catch (error) {
    console.error('Error in handlePost:', error)
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message })
    }
    return res.status(500).json({ message: 'An unexpected error occurred.' })
  }
}
