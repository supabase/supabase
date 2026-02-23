import pgMeta from '@supabase/pg-meta'
import type { JwtPayload } from '@supabase/supabase-js'
import { safeValidateUIMessages } from 'ai'
import { IS_PLATFORM } from 'common'
import { executeSql } from 'data/sql/execute-sql-query'
import type { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { generateAssistantResponse } from 'lib/ai/generate-assistant-response'
import { getModel } from 'lib/ai/model'
import { getOrgAIDetails } from 'lib/ai/org-ai-details'
import { getTools } from 'lib/ai/tools'
import apiWrapper from 'lib/api/apiWrapper'
import { executeQuery } from 'lib/api/self-hosted/query'
import { getURL } from 'lib/helpers'
import type { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'

export const maxDuration = 120

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
}

async function handler(req: NextApiRequest, res: NextApiResponse, claims?: JwtPayload) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res, claims)
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
  messages: z.array(z.any()),
  projectRef: z.string(),
  connectionString: z.string(),
  schema: z.string().optional(),
  table: z.string().optional(),
  chatId: z.string().optional(),
  chatName: z.string().optional(),
  orgSlug: z.string().optional(),
  model: z.enum(['gpt-5', 'gpt-5-mini']).optional(),
})

async function handlePost(req: NextApiRequest, res: NextApiResponse, claims?: JwtPayload) {
  const authorization = req.headers.authorization
  const accessToken = authorization?.replace('Bearer ', '')

  if (IS_PLATFORM && !accessToken) {
    return res.status(401).json({ error: 'Authorization token is required' })
  }

  const userId = claims?.sub

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
    chatId,
    chatName,
    model: requestedModel,
  } = data

  const messagesValidation = await safeValidateUIMessages({ messages: rawMessages })
  if (!messagesValidation.success) {
    return res
      .status(400)
      .json({ error: 'Invalid request body', message: messagesValidation.error.message })
  }
  const messages = messagesValidation.data

  let aiOptInLevel: AiOptInLevel = 'disabled'
  let isLimited = false
  let isHipaaEnabled = false
  let orgId: number | undefined
  let planId: string | undefined

  if (!IS_PLATFORM) {
    aiOptInLevel = 'schema'
  }

  if (IS_PLATFORM && orgSlug && authorization && projectRef) {
    try {
      // Get organizations and compute opt in level server-side
      const {
        aiOptInLevel: orgAIOptInLevel,
        isLimited: orgAILimited,
        isHipaaEnabled: orgIsHipaaEnabled,
        orgId: fetchedOrgId,
        planId: fetchedPlanId,
      } = await getOrgAIDetails({
        orgSlug,
        authorization,
        projectRef,
      })

      aiOptInLevel = orgAIOptInLevel
      isLimited = orgAILimited
      isHipaaEnabled = orgIsHipaaEnabled
      orgId = fetchedOrgId
      planId = fetchedPlanId
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
      baseUrl: getURL(),
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
      messages,
      model,
      tools,
      aiOptInLevel,
      getSchemas: aiOptInLevel !== 'disabled' ? getSchemas : undefined,
      projectRef,
      chatId,
      chatName,
      isHipaaEnabled,
      userId,
      orgId,
      planId,
      requestedModel,
      promptProviderOptions,
      providerOptions,
      abortSignal: abortController.signal,
      onSpanCreated: (spanId) => {
        res.setHeader('x-braintrust-span-id', spanId)
      },
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
