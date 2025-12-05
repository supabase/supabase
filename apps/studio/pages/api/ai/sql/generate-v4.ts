import pgMeta from '@supabase/pg-meta'
import {
  convertToModelMessages,
  generateText,
  isToolUIPart,
  type LanguageModel,
  type ModelMessage,
  stepCountIs,
  streamText,
  type ToolSet,
  type UIMessage,
} from 'ai'
import { source } from 'common-tags'
import type { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'

import { IS_PLATFORM } from 'common'
import { executeSql } from 'data/sql/execute-sql-query'
import type { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { getModel } from 'lib/ai/model'
import { getOrgAIDetails } from 'lib/ai/org-ai-details'
import {
  CHAT_PROMPT,
  EDGE_FUNCTION_PROMPT,
  GENERAL_PROMPT,
  PG_BEST_PRACTICES,
  RLS_PROMPT,
  REALTIME_PROMPT,
  SECURITY_PROMPT,
  LIMITATIONS_PROMPT,
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

export async function generateAssistantResponse({
  messages: rawMessages,
  model,
  tools,
  aiOptInLevel = 'schema',
  getSchemas,
  projectRef,
  chatName,
  promptProviderOptions,
  providerOptions,
  abortSignal,
}: {
  messages: UIMessage[]
  model: LanguageModel
  tools: ToolSet
  aiOptInLevel?: AiOptInLevel
  getSchemas?: () => Promise<string>
  projectRef?: string
  chatName?: string
  promptProviderOptions?: Record<string, any>
  providerOptions?: Record<string, any>
  abortSignal?: AbortSignal
}) {
  // Only returns last 7 messages
  // Filters out tools with invalid states
  // Filters out tool outputs based on opt-in level using renderingToolOutputParser
  const messages = (rawMessages || []).slice(-7).map((msg) => {
    if (msg && msg.role === 'assistant' && 'results' in msg) {
      const cleanedMsg = { ...msg }
      delete cleanedMsg.results
      return cleanedMsg
    }
    if (msg && msg.role === 'assistant' && msg.parts) {
      const cleanedParts = msg.parts
        .filter((part) => {
          if (isToolUIPart(part)) {
            const invalidStates = ['input-streaming', 'input-available', 'output-error']
            return !invalidStates.includes(part.state)
          }
          return true
        })
        .map((part) => {
          return sanitizeMessagePart(part, aiOptInLevel)
        })
      return { ...msg, parts: cleanedParts }
    }
    return msg
  })

  const schemasString =
    aiOptInLevel !== 'disabled' && getSchemas
      ? await getSchemas()
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
  const assistantContent =
    projectRef || chatName || schemasString !== "You don't have access to any schemas."
      ? `The user's current project is ${projectRef || 'unknown'}. Their available schemas are: ${schemasString}. The current chat name is: ${chatName || 'unnamed'}`
      : undefined

  const coreMessages: ModelMessage[] = [
    {
      role: 'system',
      content: system,
      ...(promptProviderOptions && {
        providerOptions: promptProviderOptions,
      }),
    },
    ...(assistantContent
      ? [
          {
            role: 'assistant' as const,
            // Add any dynamic context here
            content: assistantContent,
          },
        ]
      : []),
    ...convertToModelMessages(messages),
  ]

  return streamText({
    model,
    stopWhen: stepCountIs(5),
    messages: coreMessages,
    ...(providerOptions && { providerOptions }),
    tools,
    ...(abortSignal && { abortSignal }),
  })
}

const requestBodySchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
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
    messages: rawMessages,
    projectRef,
    connectionString,
    orgSlug,
    chatName,
    model: requestedModel,
  } = data

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
    const abortController = new AbortController()
    req.on('close', () => abortController.abort())
    req.on('aborted', () => abortController.abort())

    const tools = await getTools({
      projectRef,
      connectionString,
      authorization,
      aiOptInLevel,
      accessToken,
    })

    // Get a list of all schemas to add to context
    const getSchemas = async (): Promise<string> => {
      const pgMetaSchemasList = pgMeta.schemas.list()
      type Schemas = z.infer<(typeof pgMetaSchemasList)['zod']>

      const { result: schemas } = await executeSql<Schemas>(
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

      return schemas?.length > 0
        ? `The available database schema names are: ${JSON.stringify(schemas)}`
        : "You don't have access to any schemas."
    }

    const result = await generateAssistantResponse({
      messages: rawMessages,
      model,
      tools,
      aiOptInLevel,
      getSchemas: aiOptInLevel !== 'disabled' ? getSchemas : undefined,
      projectRef,
      chatName,
      promptProviderOptions,
      providerOptions,
      abortSignal: abortController.signal,
    })

    result.pipeUIMessageStreamToResponse(res, {
      sendReasoning: true,
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
