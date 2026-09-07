import { safeValidateUIMessages } from 'ai'

import { NO_SCHEMA_ACCESS_MESSAGE } from '../ai/assistant-context'
import {
  assistantMessageMetadataSchema,
  messagesIncludeLogsSnippets,
} from '../ai/assistant-message-metadata'
import { generateAssistantResponse } from '../ai/generate-assistant-response'
import { getAssistantModel } from '../ai/model'
import { pgMeta } from '../ai/pg-meta'
import { getTools } from '../ai/tools'
import { McpUnauthorizedError } from '../ai/tools/mcp-tools'
import { asQueryRows } from '../ai/tools/schema-tools.utils'
import { beginTurn, finishTurn, getConversation } from '../db/conversations'
import { getValidAccessToken } from '../db/oauth-connections'
import { getProjectPermissions } from '../db/project-permissions'
import { checkRateLimit } from '../db/rate-limit'
import { createManagementApi } from '../platform/management-api'
import { getPlatformPolicy } from '../platform/policy'
import { requireUserId } from './auth'
import { chatBodySchema } from './chat-body'
import { toChatResponse } from './chat-stream'
import { HttpError } from './errors'
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
    const policy = await getPlatformPolicy(
      ctx.platformToken!,
      { projectRef: conversation.project_ref, orgSlug: conversation.org_slug },
      signal
    )
    const permissions = await getProjectPermissions(
      userId,
      conversation.project_ref,
      conversation.org_slug,
      policy.canShareProjectData
    )
    if (!permissions.hasConsented)
      throw new HttpError(
        409,
        'consent_required',
        'Choose your project permissions before using the new Assistant.'
      )
    const aiOptInLevel = permissions.level
    const oauthToken = await getValidAccessToken(userId, conversation.org_slug)
    if (!oauthToken)
      throw new HttpError(409, 'oauth_required', 'Connect this organization to continue.', {
        org_slug: conversation.org_slug,
      })
    await checkRateLimit(`chat:${userId}`, 30)
    const api = createManagementApi(oauthToken, signal)
    let resources: Awaited<ReturnType<typeof getTools>> | undefined
    let claimed = false
    try {
      resources = await getTools({
        projectRef: conversation.project_ref,
        oauthToken,
        conversationId: conversation.id,
        aiOptInLevel: aiOptInLevel,
        supportMode: body.supportMode,
        signal,
        managementApi: {
          runQuery: (sql, options) => api.runQuery(conversation.project_ref, sql, options),
          deployFunction: (input) => api.deployFunction(conversation.project_ref, input),
        },
      })
      const turn = await beginTurn(
        userId,
        conversation.id,
        body.requestId,
        body.revision,
        validation.data,
        body.trigger,
        body.supportMetadata
      )
      claimed = true
      const result = await generateAssistantResponse({
        messages: turn.messages,
        ...getAssistantModel(body.model, policy.hasAccessToAdvanceModel),
        tools: resources.tools,
        aiOptInLevel: aiOptInLevel,
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
        projectRef: conversation.project_ref,
        chatName: conversation.name,
        supportMode: body.supportMode,
        includesLogsSnippets: messagesIncludeLogsSnippets(turn.messages),
        abortSignal: signal,
      })
      const close = resources.close
      return await toChatResponse(result, {
        revision: turn.revision,
        originalMessages: turn.messages,
        onFinish: async ({ responseMessage }) => {
          try {
            await finishTurn(userId, conversation.id, body.requestId, responseMessage)
          } finally {
            await close()
          }
        },
        onSettled: async () => {
          try {
            await finishTurn(userId, conversation.id, body.requestId)
          } finally {
            await close()
          }
        },
      })
    } catch (error) {
      await resources?.close()
      if (claimed) await finishTurn(userId, conversation.id, body.requestId)
      if (error instanceof McpUnauthorizedError)
        throw new HttpError(409, 'oauth_required', 'Reconnect this organization to continue.', {
          org_slug: conversation.org_slug,
        })
      throw error
    }
  },
}
