import { startAgentRun, type AgentRun } from '@supabase/agent-runtime'
import { McpConnectionError } from '@supabase/agent-runtime/mcp'
import { safeValidateUIMessages } from 'ai'

import { assistantAgent } from '../ai/agent'
import { NO_SCHEMA_ACCESS_MESSAGE } from '../ai/assistant-context'
import { assistantMessageMetadataSchema } from '../ai/assistant-message-metadata'
import { getAssistantModel } from '../ai/model'
import { pgMeta } from '../ai/pg-meta'
import { asQueryRows } from '../ai/tools/schema-tools.utils'
import { assistantPersistence } from '../db/agent-persistence'
import { getConversation } from '../db/conversations'
import { getProjectPermissions } from '../db/project-permissions'
import { checkRateLimit } from '../db/rate-limit'
import { createManagementApi } from '../platform/management-api'
import { requireUserId } from './auth'
import { chatBodySchema } from './chat-body'
import { toChatResponse } from './chat-stream'
import { HttpError } from './errors'
import { requireProjectAccess } from './project-access'
import { parseBody } from './request'
import type { Route } from './routes'

export const chatRoute: Route = {
  method: 'POST',
  pattern: '/v1/conversations/:id/chat',
  auth: 'user',
  handler: async (request, ctx, params) => {
    const userId = requireUserId(ctx)
    const body = await parseBody(request, chatBodySchema)
    const validation = await safeValidateUIMessages({
      messages: body.messages ?? [body.message],
      metadataSchema: assistantMessageMetadataSchema,
    })
    if (!validation.success)
      throw new HttpError(400, 'invalid_request', 'Invalid conversation messages.')
    const conversation = await getConversation(ctx.supabase, params.id)
    if (!conversation) throw new HttpError(404, 'not_found', 'Conversation not found.')
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(120_000)])
    const policy = await requireProjectAccess(
      userId,
      conversation.project_ref,
      conversation.org_slug,
      signal
    )
    const permissions = await getProjectPermissions(
      userId,
      conversation.project_ref,
      conversation.org_slug
    )
    if (!permissions.hasConsented)
      throw new HttpError(
        409,
        'consent_required',
        'Choose your project permissions before using the new Assistant.'
      )
    const aiOptInLevel = permissions.level
    const { oauthToken } = policy
    await checkRateLimit(`chat:${userId}`, 30)
    const api = createManagementApi(oauthToken, signal)
    let resources: Awaited<ReturnType<typeof assistantAgent.prepare>> | undefined
    let run: AgentRun<{ revision: number }> | undefined
    try {
      resources = await assistantAgent.prepare({
        abortSignal: signal,
        context: {
          projectRef: conversation.project_ref,
          oauthToken,
          aiOptInLevel,
          executeOperation: (toolCallId, name, input, execute) => {
            if (!run) throw new Error('The agent run has not started.')
            return run.executeTool({ toolCallId, name, input, execute })
          },
          supportMode: body.supportMode,
          chatName: conversation.name,
          managementApi: {
            runQuery: (sql, options) => api.runQuery(conversation.project_ref, sql, options),
            deployFunction: (input) => api.deployFunction(conversation.project_ref, input),
          },
          getSchemas:
            aiOptInLevel === 'disabled'
              ? undefined
              : async () => {
                  const rows = asQueryRows(
                    await api.runQuery(conversation.project_ref, pgMeta.schemas.list().sql, {
                      readOnly: true,
                    })
                  )
                  return rows.length
                    ? `The available database schema names are: ${JSON.stringify(rows)}`
                    : NO_SCHEMA_ACCESS_MESSAGE
                },
        },
      })
      run = await startAgentRun({
        persistence: assistantPersistence,
        context: {
          userId,
          conversationId: conversation.id,
          requestId: body.requestId,
          revision: body.revision,
          supportMetadata: body.supportMetadata,
        },
        messages: validation.data,
        trigger: body.trigger,
      })
      const currentRun = run
      const result = await resources.stream({
        messages: currentRun.messages,
        ...getAssistantModel(body.model, policy.hasAccessToAdvanceModel),
      })
      const close = resources.close
      return await toChatResponse(result, {
        revision: currentRun.state.revision,
        originalMessages: currentRun.messages,
        onFinish: async ({ responseMessage, status }) => {
          try {
            await currentRun.finish({ responseMessage, status })
          } finally {
            await close()
          }
        },
        onSettled: async ({ status }) => {
          try {
            await currentRun.finish({ status })
          } finally {
            await close()
          }
        },
      })
    } catch (error) {
      try {
        await resources?.close()
      } finally {
        await run?.finish({ status: signal.aborted ? 'cancelled' : 'failed' })
      }
      if (error instanceof McpConnectionError && error.code === 'authorization_required')
        throw new HttpError(409, 'oauth_required', 'Reconnect this organization to continue.', {
          org_slug: conversation.org_slug,
        })
      throw error
    }
  },
}
