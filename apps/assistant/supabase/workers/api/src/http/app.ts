import { createAgentWorker } from '@supabase/agent-runtime/workers'
import { bodyLimit } from 'hono/body-limit'

import type { Database } from '../db/database.types'
import { supabaseServerEnv } from '../env'
import { getPlatformPolicy } from '../platform/policy'
import { requireUserId } from './auth'
import { assistantCors } from './cors'
import { HttpError, jsonError, toErrorResponse } from './errors'
import { bearer } from './request'
import { routes } from './routes'

export const app = createAgentWorker<
  Database,
  {
    platformUserId?: string
    platformToken?: string
  }
>({
  env: supabaseServerEnv(),
  routes,
  middleware: [
    assistantCors,
    bodyLimit({
      maxSize: 5 * 1024 * 1024,
      onError: () =>
        jsonError(413, 'invalid_request', 'Request is too large. Start a new conversation.'),
    }),
  ],
  authorize: async (request, ctx) => {
    const token = bearer(request.headers.get('x-platform-authorization') ?? null)
    const policy = await getPlatformPolicy(token, {}, request.signal)
    const { data, error } = await ctx.supabase
      .from('platform_identities')
      .select('platform_user_id')
      .eq('user_id', requireUserId(ctx))
      .maybeSingle()
    if (error || data?.platform_user_id !== policy.userId)
      throw new HttpError(403, 'unauthorized', 'Sign in again to use the assistant.')
    ctx.platformUserId = policy.userId
    ctx.platformToken = token
  },
  onError: toErrorResponse,
})
