import { z } from 'zod'

import {
  createConversation,
  getConversation,
  insertFeedback,
  listConversations,
  messageToUIMessage,
  softDeleteConversation,
  truncateMessages,
  updateConversation,
} from '../db/conversations'
import { listOAuthConnections } from '../db/oauth-connections'
import { checkRateLimit } from '../db/rate-limit'
import { env } from '../env'
import { getPlatformPolicy } from '../platform/policy'
import { requireUserId, type HandlerContext } from './auth'
import { authRoutes } from './auth-routes'
import { chatRoute } from './chat-route'
import { assistantSupportMetadataSchema } from './contracts'
import { HttpError } from './errors'
import { permissionRoutes } from './permission-routes'
import { parseBody } from './request'

export type Route = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  pattern: string
  auth: 'user' | 'none'
  handler: (
    req: Request,
    ctx: HandlerContext,
    params: Record<string, string>
  ) => Response | Promise<Response>
}
const revision = z.number().int().nonnegative()

export const routes: Route[] = [
  {
    method: 'GET',
    pattern: '/health',
    auth: 'none',
    handler: () => Response.json({ ok: true, build: env.buildId }),
  },
  ...authRoutes,
  ...permissionRoutes,
  {
    method: 'GET',
    pattern: '/v1/me',
    auth: 'user',
    handler: async (_req, ctx) =>
      Response.json({
        user_id: requireUserId(ctx),
        connections: await listOAuthConnections(ctx.supabase),
        repos: [],
      }),
  },
  {
    method: 'GET',
    pattern: '/v1/projects/:ref/conversations',
    auth: 'user',
    handler: async (_req, ctx, params) =>
      Response.json({ conversations: await listConversations(ctx.supabase, params.ref) }),
  },
  {
    method: 'POST',
    pattern: '/v1/projects/:ref/conversations',
    auth: 'user',
    handler: async (req, ctx, params) => {
      const userId = requireUserId(ctx)
      const body = await parseBody(
        req,
        z.object({
          id: z.string().uuid().optional(),
          name: z.string().max(200).optional(),
          org_slug: z.string().min(1),
          model: z.string().optional(),
          support_metadata: assistantSupportMetadataSchema.optional(),
          branched_from: z
            .object({ chat_id: z.string().uuid(), message_id: z.string() })
            .optional(),
        })
      )
      await getPlatformPolicy(
        ctx.platformToken!,
        { projectRef: params.ref, orgSlug: body.org_slug },
        req.signal
      )
      await checkRateLimit(`create:${userId}`, 30)
      const conversation = await createConversation(userId, {
        id: body.id,
        projectRef: params.ref,
        orgSlug: body.org_slug,
        name: body.name,
        model: body.model,
        branchedFrom: body.branched_from,
        supportMetadata: body.support_metadata,
      })
      return Response.json({ conversation }, { status: 201 })
    },
  },
  {
    method: 'GET',
    pattern: '/v1/conversations/:id',
    auth: 'user',
    handler: async (req, ctx, params) => {
      const before = new URL(req.url).searchParams.get('before')
      const parsed = z.coerce.number().int().positive().safeParse(before)
      if (before !== null && !parsed.success)
        throw new HttpError(400, 'invalid_request', 'Invalid message cursor.')
      const conversation = await getConversation(
        ctx.supabase,
        params.id,
        before !== null && parsed.success ? parsed.data : undefined
      )
      if (!conversation) throw new HttpError(404, 'not_found', 'Conversation not found.')
      return Response.json({
        conversation,
        messages: conversation.messages.map(messageToUIMessage),
        nextCursor: conversation.hasMore ? conversation.messages[0]?.seq : null,
      })
    },
  },
  {
    method: 'PATCH',
    pattern: '/v1/conversations/:id',
    auth: 'user',
    handler: async (req, ctx, params) => {
      const body = await parseBody(
        req,
        z.object({
          revision,
          name: z.string().max(200).optional(),
          model: z.string().optional(),
          support_metadata: assistantSupportMetadataSchema.optional(),
        })
      )
      return Response.json({
        conversation: await updateConversation(requireUserId(ctx), params.id, body),
      })
    },
  },
  {
    method: 'DELETE',
    pattern: '/v1/conversations/:id',
    auth: 'user',
    handler: async (req, ctx, params) => {
      const body = await parseBody(req, z.object({ revision }))
      await softDeleteConversation(requireUserId(ctx), params.id, body.revision)
      return new Response(null, { status: 204 })
    },
  },
  {
    method: 'POST',
    pattern: '/v1/conversations/:id/truncate',
    auth: 'user',
    handler: async (req, ctx, params) => {
      const body = await parseBody(
        req,
        z.object({ revision, fromMessageId: z.string().optional() })
      )
      const nextRevision = await truncateMessages(
        requireUserId(ctx),
        params.id,
        body.revision,
        body.fromMessageId
      )
      return Response.json({ revision: nextRevision })
    },
  },
  chatRoute,
  {
    method: 'POST',
    pattern: '/v1/messages/:id/feedback',
    auth: 'user',
    handler: async (req, ctx, params) => {
      const body = await parseBody(
        req,
        z.object({
          conversation_id: z.string().uuid(),
          rating: z.enum(['positive', 'negative']),
          reason: z.string().max(4000).optional(),
          braintrust_span_id: z.string().optional(),
        })
      )
      await insertFeedback(requireUserId(ctx), {
        conversationId: body.conversation_id,
        messageId: params.id,
        rating: body.rating,
        reason: body.reason,
        braintrustSpanId: body.braintrust_span_id,
      })
      return Response.json({ ok: true })
    },
  },
]
