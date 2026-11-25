import pgMeta from '@supabase/pg-meta'
import type { JwtPayload } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import {
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  toUIMessageStream,
  type UIMessageChunk,
} from 'ai'
import { IS_PLATFORM } from 'common'
import z from 'zod'

import { unguarded } from '@/data/fetchers'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { getAIDetails } from '@/lib/ai/ai-details'
import { NO_SCHEMA_ACCESS_MESSAGE } from '@/lib/ai/assistant-context'
import {
  assistantMessageMetadataSchema,
  messagesIncludeLogsSnippets,
  type AssistantMessageMetadata,
} from '@/lib/ai/assistant-message-metadata'
import { ASSISTANT_TIMEOUT_MS } from '@/lib/ai/assistant-timeout'
import { IS_TRACING_ENABLED } from '@/lib/ai/braintrust-logger'
import { generateAssistantResponse } from '@/lib/ai/generate-assistant-response'
import { isExplorerEnabled } from '@/lib/ai/is-explorer-enabled'
import { getModel } from '@/lib/ai/model'
import {
  DEFAULT_ASSISTANT_BASE_MODEL_ID,
  getAssistantModelEntry,
  isAssistantBaseModelId,
  isKnownAssistantModelId,
  type AssistantModelId,
} from '@/lib/ai/model.utils'
import { getTools } from '@/lib/ai/tools'
import { encodeNotebookToolError } from '@/lib/ai/tools/notebook-tool-error'
import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { executeQuery } from '@/lib/api/self-hosted/query'
import { getBasePathURL } from '@/lib/helpers'
import { trustedUserEmail } from '@/lib/server/configcat'

const requestBodySchema = z.object({
  messages: z.array(z.any()),
  projectRef: z.string(),
  connectionString: z.string(),
  schema: z.string().optional(),
  table: z.string().optional(),
  chatId: z.string().optional(),
  chatName: z.string().optional(),
  supportMode: z.boolean().optional(),
  orgSlug: z.string().optional(),
  model: z.string().optional(),
})

async function handlePost(request: Request, claims?: JwtPayload): Promise<Response> {
  const requestStartedAt = Date.now()
  const authorization = request.headers.get('authorization') ?? undefined
  const accessToken = authorization?.replace('Bearer ', '')

  if (IS_PLATFORM && !accessToken) {
    return Response.json({ error: 'Authorization token is required' }, { status: 401 })
  }

  const userId = claims?.sub

  const body = await parseJsonBody(request)
  const { data, error: parseError } = requestBodySchema.safeParse(body)

  if (parseError) {
    return Response.json(
      { error: 'Invalid request body', issues: parseError.issues },
      { status: 400 }
    )
  }

  const {
    messages: rawMessages,
    projectRef,
    connectionString,
    orgSlug: rawOrgSlug,
    chatId,
    chatName,
    model: rawRequestedModel,
    supportMode,
  } = data

  const requestedModel: AssistantModelId | undefined =
    rawRequestedModel && isKnownAssistantModelId(rawRequestedModel) ? rawRequestedModel : undefined

  const messagesValidation = await safeValidateUIMessages({
    messages: rawMessages,
    metadataSchema: assistantMessageMetadataSchema,
  })
  if (!messagesValidation.success) {
    return Response.json(
      {
        error: 'Invalid request body',
        message: messagesValidation.error.message,
      },
      { status: 400 }
    )
  }
  const messages = messagesValidation.data

  const includesLogsSnippets = messagesIncludeLogsSnippets(messages)

  let aiOptInLevel: AiOptInLevel = 'disabled'
  let hasAccessToAdvanceModel = false
  let isHighComplianceProject: boolean | undefined
  let orgId: number | undefined
  let orgSlug: string | undefined
  let planId: string | undefined
  let projectRegion: string | undefined

  if (!IS_PLATFORM) {
    aiOptInLevel = 'schema'
    hasAccessToAdvanceModel = true
  }

  if (IS_PLATFORM && rawOrgSlug && authorization && projectRef) {
    try {
      const aiDetails = await getAIDetails({ orgSlug: rawOrgSlug, projectRef, authorization })

      aiOptInLevel = aiDetails.aiOptInLevel
      hasAccessToAdvanceModel = aiDetails.hasAccessToAdvanceModel
      orgId = aiDetails.orgId
      orgSlug = aiDetails.orgSlug
      planId = aiDetails.planId
      projectRegion = aiDetails.projectRegion
      isHighComplianceProject = aiDetails.isHighComplianceProject
    } catch {
      return Response.json(
        { error: 'There was an error fetching your organization details' },
        { status: 400 }
      )
    }
  }

  const explorerEnabled = await isExplorerEnabled(trustedUserEmail(claims?.email))

  const envThrottled = process.env.IS_THROTTLED !== 'false'

  let effectiveModel: AssistantModelId = requestedModel ?? DEFAULT_ASSISTANT_BASE_MODEL_ID
  if (!isAssistantBaseModelId(effectiveModel) && (!hasAccessToAdvanceModel || envThrottled)) {
    effectiveModel = DEFAULT_ASSISTANT_BASE_MODEL_ID
  }

  const {
    modelParams,
    error: modelError,
    systemProviderOptions,
  } = await getModel({
    provider: 'openai',
    modelEntry: getAssistantModelEntry(effectiveModel),
  })

  if (modelError) {
    return Response.json({ error: modelError.message }, { status: 500 })
  }

  const abortController = new AbortController()
  const onRequestAbort = () => abortController.abort()
  if (request.signal.aborted) {
    abortController.abort()
  } else {
    request.signal.addEventListener('abort', onRequestAbort, { once: true })
  }
  const cleanup = () => {
    request.signal.removeEventListener('abort', onRequestAbort)
    abortController.abort()
  }

  try {
    const tools = await getTools({
      projectRef,
      connectionString,
      authorization,
      aiOptInLevel,
      accessToken,
      baseUrl: getBasePathURL(),
      supportMode,
      isExplorerEnabled: explorerEnabled,
      signal: abortController.signal,
    })

    // Get a list of all schemas to add to context
    const getSchemas = async (): Promise<string> => {
      const pgMetaSchemasList = pgMeta.schemas.list()
      type Schemas = z.infer<(typeof pgMetaSchemasList)['zod']>

      const { result: schemas } = await executeSql<Schemas>(
        {
          projectRef,
          connectionString,
          sqlOrigin: 'studio',
          queryName: 'ai-sql-generate-schemas',
          sql: pgMetaSchemasList.sql,
          grant: unguarded.migrating,
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
        : NO_SCHEMA_ACCESS_MESSAGE
    }

    let braintrustSpanId: string | undefined

    const result = await generateAssistantResponse({
      messages,
      ...modelParams,
      tools,
      aiOptInLevel,
      getSchemas: aiOptInLevel !== 'disabled' ? getSchemas : undefined,
      projectRef,
      projectRegion,
      chatId,
      chatName,
      // A defined orgId means getAIDetails confirmed the project belongs to the organization.
      allowTracing: IS_TRACING_ENABLED && orgId !== undefined,
      supportMode,
      userId,
      orgId,
      orgSlug,
      planId,
      isHighComplianceProject,
      includesLogsSnippets,
      requestedModel,
      effectiveModel,
      systemProviderOptions,
      abortSignal: abortController.signal,
      timeout: { totalMs: Math.max(0, ASSISTANT_TIMEOUT_MS - (Date.now() - requestStartedAt)) },
      onSpanCreated: (spanId) => {
        braintrustSpanId = spanId
      },
    })

    const stream = toUIMessageStream({
      stream: result.stream,
      sendReasoning: true,
      onError: (error) => {
        console.error('Assistant stream error:', error)

        const encoded = encodeNotebookToolError(error)
        if (encoded !== null) return encoded

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
      // The browser never receives an abort caused by its own disconnect, so any abort that
      // reaches it is the deadline. Chat ignores abort chunks, so flag the message instead.
      messageMetadata: ({ part }): AssistantMessageMetadata =>
        part.type === 'abort' ? { timedOut: true } : undefined,
    })

    // Abort when the stream finishes, errors, or is cancelled so the remote MCP connection opened
    // in getTools is always released. Abort here rather than in toUIMessageStream's onEnd: that
    // callback rebuilds the response message, which fails on approval continuations without the
    // client's original messages.
    const reader = stream.getReader()
    const trackedStream = new ReadableStream<UIMessageChunk>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read()
          if (done) {
            controller.close()
            cleanup()
            return
          }
          controller.enqueue(value)
        } catch (error) {
          cleanup()
          controller.error(error)
        }
      },
      async cancel(reason) {
        cleanup()
        await reader.cancel(reason)
      },
    })

    return createUIMessageStreamResponse({
      stream: trackedStream,
      headers: {
        'Content-Encoding': 'none',
        ...(braintrustSpanId && { 'x-braintrust-span-id': braintrustSpanId }),
      },
    })
  } catch (error) {
    cleanup()
    console.error('Error in handlePost:', error)
    if (error instanceof Error) {
      return Response.json({ message: error.message }, { status: 500 })
    }
    return Response.json({ message: 'An unexpected error occurred.' }, { status: 500 })
  }
}

export const Route = createFileRoute('/api/ai/sql/generate-v4')({
  server: {
    handlers: createApiHandlers(
      {
        POST: ({ request, claims }) => handlePost(request, claims),
      },
      { withAuth: true }
    ),
  },
})
