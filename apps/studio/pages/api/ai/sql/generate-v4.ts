import pgMeta from '@supabase/pg-meta'
import { convertToModelMessages, ModelMessage, stepCountIs, streamText } from 'ai'
import { source } from 'common-tags'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod/v4'

import { IS_PLATFORM } from 'common'
import { executeSql } from 'data/sql/execute-sql-query'
import { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { getModel } from 'lib/ai/model'
import { getOrgAIDetails } from 'lib/ai/org-ai-details'
import { getTools } from 'lib/ai/tools'
import apiWrapper from 'lib/api/apiWrapper'
import { queryPgMetaSelfHosted } from 'lib/self-hosted'

import {
  CHAT_PROMPT,
  EDGE_FUNCTION_PROMPT,
  GENERAL_PROMPT,
  PG_BEST_PRACTICES,
  RLS_PROMPT,
  SECURITY_PROMPT,
} from 'lib/ai/prompts'

export const maxDuration = 120

export const config = {
  api: { bodyParser: true },
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper

const requestBodySchema = z.object({
  messages: z.array(z.any()),
  projectRef: z.string(),
  connectionString: z.string(),
  schema: z.string().optional(),
  table: z.string().optional(),
  chatName: z.string().optional(),
  orgSlug: z.string().optional(),
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

  const { messages: rawMessages, projectRef, connectionString, orgSlug, chatName } = data

  // Server-side safety: limit to last 7 messages and remove `results` property to prevent accidental leakage.
  // Results property is used to cache results client-side after queries are run
  // Tool results will still be included in history sent to model
  const messages = (rawMessages || []).slice(-7).map((msg: any) => {
    if (msg && msg.role === 'assistant' && 'results' in msg) {
      const cleanedMsg = { ...msg }
      delete cleanedMsg.results
      return cleanedMsg
    }
    // [Joshen] Am also filtering out any tool calls which state is "input-streaming"
    // this happens when a user stops the assistant response while the tool is being called
    if (msg && msg.role === 'assistant' && msg.parts) {
      const cleanedParts = msg.parts.filter((part: any) => {
        return !(part.type.startsWith('tool-') && part.state === 'input-streaming')
      })
      return { ...msg, parts: cleanedParts }
    }
    return msg
  })

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
      return res
        .status(400)
        .json({ error: 'There was an error fetching your organization details' })
    }
  }

  const { model, error: modelError } = await getModel(projectRef, isLimited) // use project ref as routing key

  if (modelError) {
    return res.status(500).json({ error: modelError.message })
  }

  try {
    // Get a list of all schemas to add to context
    const pgMetaSchemasList = pgMeta.schemas.list()

    const { result: schemas } =
      aiOptInLevel !== 'disabled'
        ? await executeSql(
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
            IS_PLATFORM ? undefined : queryPgMetaSelfHosted
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
      ${SECURITY_PROMPT}
    `

    // Note: these must be of type `CoreMessage` to prevent AI SDK from stripping `providerOptions`
    // https://github.com/vercel/ai/blob/81ef2511311e8af34d75e37fc8204a82e775e8c3/packages/ai/core/prompt/standardize-prompt.ts#L83-L88
    const coreMessages: ModelMessage[] = [
      {
        role: 'system',
        content: system,
        providerOptions: {
          bedrock: {
            // Always cache the system prompt (must not contain dynamic content)
            cachePoint: { type: 'default' },
          },
        },
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

    // Get tools
    const tools = await getTools({
      projectRef,
      connectionString,
      authorization,
      aiOptInLevel,
      accessToken,
    })

    const result = streamText({
      model,
      stopWhen: stepCountIs(5),
      messages: coreMessages,
      tools,
      abortSignal: abortController.signal,
    })

    result.pipeUIMessageStreamToResponse(res, {
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
