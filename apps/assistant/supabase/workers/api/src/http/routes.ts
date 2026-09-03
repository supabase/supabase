import { safeValidateUIMessages, type UIMessage } from 'ai'
import { z } from 'zod'

import { NO_SCHEMA_ACCESS_MESSAGE } from '../ai/assistant-context.ts'
import {
  assistantMessageMetadataSchema,
  messagesIncludeLogsSnippets,
} from '../ai/assistant-message-metadata.ts'
import { generateAssistantResponse } from '../ai/generate-assistant-response.ts'
import { getModel } from '../ai/model.ts'
import {
  DEFAULT_ASSISTANT_BASE_MODEL_ID,
  getAssistantModelEntry,
  isKnownAssistantModelId,
  type AssistantModelId,
} from '../ai/model.utils.ts'
import { pgMeta } from '../ai/pg-meta.ts'
import { getTools } from '../ai/tools/index.ts'
import { McpUnauthorizedError } from '../ai/tools/mcp-tools.ts'
import {
  createConversation,
  getConversation,
  insertFeedback,
  listConversations,
  messageToUIMessage,
  softDeleteConversation,
  updateConversation,
  upsertMessage,
  upsertMessages,
} from '../db/conversations'
import { messagesToPersistAfterChat } from '../db/conversations.utils'
import {
  getValidAccessToken,
  listOAuthConnections,
  storeOAuthTokens,
} from '../db/oauth-connections'
import { env } from '../env.ts'
import { createManagementApi } from '../platform/management-api'
import {
  buildAuthorizeUrl,
  exchangeCode,
  findOrganizationMismatch,
  generateOAuthState,
  generatePkce,
  tokenExpiresAt,
  tokenScopes,
  type OrganizationMismatch,
} from '../platform/oauth'
import { verifyPlatformJwt } from '../platform/platform-jwt'
import { bearerToken, createPublishableClient, requireUserId, resolveAdmin } from './auth'
import { chatBodySchema } from './chat-body'
import { toChatResponse } from './chat-stream'
import { isAllowedOrigin } from './cors'
import { HttpError, jsonError } from './errors'
import { buildOAuthCallbackHtml, buildOAuthMismatchHtml } from './oauth-callback-page'
import type { Route } from './route-types'

const LIST_SCHEMAS_SQL = pgMeta.schemas.list().sql

const OAUTH_STATE_TTL_MS = 15 * 60 * 1000

const createConversationBodySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().optional(),
  org_slug: z.string().min(1),
  model: z.string().optional(),
  branched_from: z.unknown().optional(),
})

const updateConversationBodySchema = z.object({
  name: z.string().optional(),
  model: z.string().optional(),
})

const feedbackBodySchema = z.object({
  conversation_id: z.string().uuid(),
  rating: z.enum(['positive', 'negative']),
  reason: z.string().optional(),
  braintrust_span_id: z.string().optional(),
})

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new HttpError(400, 'invalid_request', 'Request body must be JSON.')
  }
}

function safeReturnTo(value: string | null): string | null {
  if (!value) return null
  if (value.startsWith('/') && !value.startsWith('//')) return value
  try {
    const url = new URL(value)
    if (isAllowedOrigin(url.origin)) return value
  } catch {
    return null
  }
  return null
}

function schemaRows(data: unknown): { name: string }[] {
  if (Array.isArray(data)) return data as { name: string }[]
  if (
    data &&
    typeof data === 'object' &&
    'result' in data &&
    Array.isArray((data as { result: unknown }).result)
  ) {
    return (data as { result: { name: string }[] }).result
  }
  return []
}

async function parseUIMessages(raw: unknown[]): Promise<UIMessage[]> {
  const validation = await safeValidateUIMessages({
    messages: raw,
    metadataSchema: assistantMessageMetadataSchema,
  })
  if (!validation.success) {
    throw new HttpError(400, 'invalid_request', validation.error.message)
  }
  return validation.data
}

/**
 * A Management API failure here is not a mismatch; the token gets validated on
 * first use anyway. Only a successful org list that excludes the Studio org is.
 */
async function detectOrganizationMismatch(
  accessToken: string,
  expectedSlug: string
): Promise<OrganizationMismatch | null> {
  try {
    const organizations = await createManagementApi(accessToken).listOrganizations()
    return findOrganizationMismatch({ expectedSlug, organizations })
  } catch (error) {
    console.error('Could not verify the connected organization', error)
    return null
  }
}

function findRenameChatName(messages: UIMessage[]): string | undefined {
  for (const message of messages) {
    for (const part of message.parts ?? []) {
      if (!part || typeof part !== 'object' || !('type' in part)) continue
      if (part.type !== 'tool-rename_chat') continue
      if (!('input' in part) || typeof part.input !== 'object' || part.input === null) continue
      const newName = (part.input as { newName?: unknown }).newName
      if (typeof newName === 'string' && newName.length > 0) return newName
    }
  }
  return undefined
}

export const routes: Route[] = [
  {
    method: 'GET',
    pattern: '/health',
    auth: 'none',
    handler: async () => Response.json({ ok: true }),
  },
  {
    method: 'POST',
    pattern: '/auth/exchange',
    auth: 'none',
    handler: async (request, ctx) => {
      const token = bearerToken(request)
      if (!token) {
        throw new HttpError(401, 'unauthorized', 'Missing platform bearer token.')
      }

      const identity = await verifyPlatformJwt(token)
      const admin = resolveAdmin(ctx)
      const email = identity.email ?? `${identity.sub}@platform.invalid`

      const { data: existing, error: existingError } = await admin
        .from('platform_identities')
        .select('user_id, email')
        .eq('platform_user_id', identity.sub)
        .maybeSingle()

      if (existingError) {
        throw new Error(`Failed to look up platform identity: ${existingError.message}`)
      }

      let userId = existing?.user_id as string | undefined
      let sessionEmail = email

      if (!userId) {
        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          app_metadata: { platform_user_id: identity.sub },
        })
        if (createError || !created.user) {
          throw new Error(
            `Failed to create assistant user: ${createError?.message ?? 'empty user'}`
          )
        }
        userId = created.user.id
        sessionEmail = created.user.email ?? email

        const { error: insertError } = await admin.from('platform_identities').insert({
          platform_user_id: identity.sub,
          user_id: userId,
          email: sessionEmail,
        })
        if (insertError) {
          throw new Error(`Failed to store platform identity: ${insertError.message}`)
        }
      } else {
        const { data: userData } = await admin.auth.admin.getUserById(userId)
        sessionEmail = userData.user?.email ?? (existing?.email as string | undefined) ?? email
        if (identity.email && identity.email !== existing?.email) {
          await admin
            .from('platform_identities')
            .update({ email: identity.email })
            .eq('platform_user_id', identity.sub)
        }
      }

      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: sessionEmail,
      })
      if (linkError || !linkData.properties?.hashed_token) {
        throw new Error(`Failed to mint session: ${linkError?.message ?? 'missing hashed_token'}`)
      }

      const publishable = createPublishableClient()
      const { data: sessionData, error: verifyError } = await publishable.auth.verifyOtp({
        type: 'email',
        token_hash: linkData.properties.hashed_token,
      })
      if (verifyError || !sessionData.session) {
        throw new Error(`Failed to verify session: ${verifyError?.message ?? 'missing session'}`)
      }

      const session = sessionData.session
      return Response.json({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user_id: session.user.id,
      })
    },
  },
  {
    method: 'GET',
    pattern: '/oauth/start',
    auth: 'user',
    handler: async (request, ctx) => {
      const userId = requireUserId(ctx)
      const url = new URL(request.url)
      const orgSlug = url.searchParams.get('org_slug')
      if (!orgSlug) {
        throw new HttpError(400, 'invalid_request', 'org_slug is required.')
      }

      const returnTo = safeReturnTo(url.searchParams.get('return_to'))
      const state = generateOAuthState()
      const { codeVerifier, codeChallenge } = generatePkce()
      const admin = resolveAdmin(ctx)

      const { error } = await admin.from('oauth_states').insert({
        state,
        user_id: userId,
        org_slug: orgSlug,
        code_verifier: codeVerifier,
        return_to: returnTo,
        expires_at: new Date(Date.now() + OAUTH_STATE_TTL_MS).toISOString(),
      })
      if (error) {
        throw new Error(`Failed to store OAuth state: ${error.message}`)
      }

      return Response.json({
        authorize_url: buildAuthorizeUrl({ state, codeChallenge, orgSlug }),
      })
    },
  },
  {
    method: 'GET',
    pattern: '/oauth/callback',
    auth: 'none',
    handler: async (request, ctx) => {
      const url = new URL(request.url)
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      if (!code || !state) {
        throw new HttpError(400, 'invalid_request', 'code and state are required.')
      }

      const admin = resolveAdmin(ctx)
      const { data: stored, error: lookupError } = await admin
        .from('oauth_states')
        .select('user_id, org_slug, code_verifier, return_to, expires_at')
        .eq('state', state)
        .maybeSingle()

      if (lookupError) {
        throw new Error(`Failed to look up OAuth state: ${lookupError.message}`)
      }
      if (!stored || new Date(stored.expires_at as string).getTime() < Date.now()) {
        throw new HttpError(400, 'invalid_request', 'Invalid or expired OAuth state.')
      }

      const tokens = await exchangeCode({
        code,
        codeVerifier: stored.code_verifier as string,
      })

      const returnTo = safeReturnTo((stored.return_to as string | null) ?? null)
      const mismatch = await detectOrganizationMismatch(
        tokens.access_token,
        stored.org_slug as string
      )
      if (mismatch) {
        await admin.from('oauth_states').delete().eq('state', state)
        return new Response(
          buildOAuthMismatchHtml({
            ...mismatch,
            managementApiUrl: env.managementApiUrl,
            returnTo,
          }),
          {
            status: 409,
            headers: {
              'content-type': 'text/html; charset=utf-8',
              'cache-control': 'no-store',
            },
          }
        )
      }

      await storeOAuthTokens({
        userId: stored.user_id as string,
        orgSlug: stored.org_slug as string,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokenExpiresAt(tokens),
        scopes: tokenScopes(tokens),
      })

      await admin.from('oauth_states').delete().eq('state', state)

      const html = buildOAuthCallbackHtml({
        orgSlug: stored.org_slug as string,
        returnTo,
      })
      return new Response(html, {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
        },
      })
    },
  },
  {
    method: 'GET',
    pattern: '/v1/me',
    auth: 'user',
    handler: async (_request, ctx) => {
      const userId = requireUserId(ctx)
      const connections = await listOAuthConnections(ctx.supabase)
      return Response.json({
        user_id: userId,
        connections,
        repos: [],
      })
    },
  },
  {
    method: 'GET',
    pattern: '/v1/projects/:ref/conversations',
    auth: 'user',
    handler: async (_request, ctx, params) => {
      requireUserId(ctx)
      const conversations = await listConversations(ctx.supabase, params.ref)
      return Response.json({ conversations })
    },
  },
  {
    method: 'POST',
    pattern: '/v1/projects/:ref/conversations',
    auth: 'user',
    handler: async (request, ctx, params) => {
      const userId = requireUserId(ctx)
      const parsed = createConversationBodySchema.safeParse(await readJson(request))
      if (!parsed.success) {
        return jsonError(400, 'invalid_request', 'Invalid request body', {
          issues: parsed.error.issues,
        })
      }
      const conversation = await createConversation(ctx.supabase, userId, {
        id: parsed.data.id,
        projectRef: params.ref,
        orgSlug: parsed.data.org_slug,
        name: parsed.data.name,
        model: parsed.data.model,
        branchedFrom: parsed.data.branched_from,
      })
      return Response.json({ conversation }, { status: 201 })
    },
  },
  {
    method: 'GET',
    pattern: '/v1/conversations/:id',
    auth: 'user',
    handler: async (_request, ctx, params) => {
      requireUserId(ctx)
      const conversation = await getConversation(ctx.supabase, params.id)
      if (!conversation) {
        throw new HttpError(404, 'not_found', 'Conversation not found.')
      }
      return Response.json({
        conversation: {
          id: conversation.id,
          project_ref: conversation.project_ref,
          org_slug: conversation.org_slug,
          name: conversation.name,
          model: conversation.model,
          support_metadata: conversation.support_metadata,
          branched_from: conversation.branched_from,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
        },
        messages: conversation.messages.map(messageToUIMessage),
      })
    },
  },
  {
    method: 'PATCH',
    pattern: '/v1/conversations/:id',
    auth: 'user',
    handler: async (request, ctx, params) => {
      requireUserId(ctx)
      const parsed = updateConversationBodySchema.safeParse(await readJson(request))
      if (!parsed.success) {
        return jsonError(400, 'invalid_request', 'Invalid request body', {
          issues: parsed.error.issues,
        })
      }
      try {
        const conversation = await updateConversation(ctx.supabase, params.id, parsed.data)
        return Response.json({ conversation })
      } catch {
        throw new HttpError(404, 'not_found', 'Conversation not found.')
      }
    },
  },
  {
    method: 'DELETE',
    pattern: '/v1/conversations/:id',
    auth: 'user',
    handler: async (_request, ctx, params) => {
      requireUserId(ctx)
      try {
        await softDeleteConversation(ctx.supabase, params.id)
      } catch {
        throw new HttpError(404, 'not_found', 'Conversation not found.')
      }
      return new Response(null, { status: 204 })
    },
  },
  {
    method: 'POST',
    pattern: '/v1/conversations/:id/chat',
    auth: 'user',
    handler: async (request, ctx, params) => {
      const userId = requireUserId(ctx)
      const parsed = chatBodySchema.safeParse(await readJson(request))
      if (!parsed.success) {
        return jsonError(400, 'invalid_request', 'Invalid request body', {
          issues: parsed.error.issues,
        })
      }

      const incomingRaw =
        parsed.data.messages && parsed.data.messages.length > 0
          ? parsed.data.messages
          : [parsed.data.message]
      const incoming = await parseUIMessages(incomingRaw)
      const latest = incoming[incoming.length - 1]
      if (!latest) {
        throw new HttpError(400, 'invalid_request', 'message or messages is required.')
      }

      const conversation = await getConversation(ctx.supabase, params.id)
      if (!conversation) {
        throw new HttpError(404, 'not_found', 'Conversation not found.')
      }

      if (parsed.data.messages && parsed.data.messages.length > 0) {
        await upsertMessages(ctx.supabase, conversation.id, userId, incoming)
      } else {
        await upsertMessage(ctx.supabase, {
          conversationId: conversation.id,
          userId,
          message: latest,
        })
      }

      const loaded = await getConversation(ctx.supabase, conversation.id)
      if (!loaded) {
        throw new HttpError(404, 'not_found', 'Conversation not found.')
      }
      const messages = loaded.messages.map(messageToUIMessage)

      const oauthToken = await getValidAccessToken(userId, conversation.org_slug)
      if (!oauthToken) {
        return jsonError(409, 'oauth_required', 'Connect this organization to continue.', {
          org_slug: conversation.org_slug,
        })
      }

      const requestedModel = parsed.data.model
      const effectiveModel: AssistantModelId =
        requestedModel && isKnownAssistantModelId(requestedModel)
          ? requestedModel
          : DEFAULT_ASSISTANT_BASE_MODEL_ID

      const {
        modelParams,
        error: modelError,
        systemProviderOptions,
      } = await getModel({
        provider: 'openai',
        modelEntry: getAssistantModelEntry(effectiveModel),
      })

      if (modelError || !modelParams) {
        throw new HttpError(
          500,
          'internal',
          modelError instanceof Error ? modelError.message : 'Failed to load the assistant model.'
        )
      }

      const managementApi = createManagementApi(oauthToken)
      const projectRef = conversation.project_ref
      const supportMode = parsed.data.supportMode

      let tools: Awaited<ReturnType<typeof getTools>>
      try {
        tools = await getTools({
          projectRef,
          oauthToken,
          managementApi: {
            runQuery: (sql, opts) => managementApi.runQuery(projectRef, sql, opts),
            deployFunction: (input) => managementApi.deployFunction(projectRef, input),
          },
          supportMode,
          signal: request.signal,
        })
      } catch (error) {
        if (error instanceof McpUnauthorizedError) {
          console.error(error.message)
          return jsonError(409, 'oauth_required', 'Reconnect this organization to continue.', {
            org_slug: conversation.org_slug,
            reason: 'token_rejected',
          })
        }
        throw error
      }

      const getSchemas = async (): Promise<string> => {
        try {
          const result = await managementApi.runQuery(projectRef, LIST_SCHEMAS_SQL, {
            readOnly: true,
          })
          const schemas = schemaRows(result)
          return schemas.length > 0
            ? `The available database schema names are: ${JSON.stringify(schemas)}`
            : NO_SCHEMA_ACCESS_MESSAGE
        } catch (error) {
          console.error('Failed to list schemas', error)
          return NO_SCHEMA_ACCESS_MESSAGE
        }
      }

      const result = await generateAssistantResponse({
        messages,
        ...modelParams,
        tools,
        aiOptInLevel: 'schema_and_log_and_data',
        getSchemas,
        projectRef,
        chatName: conversation.name,
        supportMode,
        includesLogsSnippets: messagesIncludeLogsSnippets(messages),
        systemProviderOptions,
        abortSignal: request.signal,
      })

      const originalIds = new Set(messages.map((message) => message.id))

      return toChatResponse(result, {
        originalMessages: messages,
        onFinish: async ({ messages: next, responseMessage }) => {
          try {
            const toStore = messagesToPersistAfterChat({
              originalIds,
              messages: next,
              responseMessage,
            })
            if (toStore.length > 0) {
              await upsertMessages(ctx.supabase, conversation.id, userId, toStore)
            }
            const renamed = findRenameChatName(next)
            if (renamed) {
              await updateConversation(ctx.supabase, conversation.id, { name: renamed })
            }
          } catch (error) {
            // `toUIMessageStream` awaits onFinish in flush(); throwing here aborts SSE.
            console.error('Failed to persist chat messages', error)
          }
        },
      })
    },
  },
  {
    method: 'POST',
    pattern: '/v1/messages/:id/feedback',
    auth: 'user',
    handler: async (request, ctx, params) => {
      const userId = requireUserId(ctx)
      const parsed = feedbackBodySchema.safeParse(await readJson(request))
      if (!parsed.success) {
        return jsonError(400, 'invalid_request', 'Invalid request body', {
          issues: parsed.error.issues,
        })
      }
      await insertFeedback(ctx.supabase, {
        conversationId: parsed.data.conversation_id,
        messageId: params.id,
        userId,
        rating: parsed.data.rating,
        reason: parsed.data.reason,
        braintrustSpanId: parsed.data.braintrust_span_id,
      })
      return Response.json({ ok: true })
    },
  },
]
