import { createHash } from 'node:crypto'
import { z } from 'zod'

import { storeOAuthTokens } from '../db/oauth-connections'
import { adminQuery, withAdvisoryLock } from '../db/postgres'
import { checkRateLimit } from '../db/rate-limit'
import { verifyPlatformIdentity } from '../platform/identity'
import { createManagementApi } from '../platform/management-api'
import {
  buildAuthorizeUrl,
  exchangeCode,
  generateOAuthState,
  tokenExpiresAt,
  tokenScopes,
} from '../platform/oauth'
import { requireUserId } from './auth'
import { isAllowedOrigin } from './cors'
import { HttpError } from './errors'
import { buildOAuthCodeHtml } from './oauth-callback-page'
import { bearer, parseBody } from './request'
import type { Route } from './routes'

export const authRoutes: Route[] = [
  {
    method: 'POST',
    pattern: '/auth/exchange',
    auth: 'none',
    handler: async (request, ctx) => {
      const identity = await verifyPlatformIdentity(
        bearer(request.headers.get('authorization')),
        request.signal
      )
      await checkRateLimit(`exchange:${identity.userId}`, 30)
      return withAdvisoryLock(`identity:${identity.userId}`, async () => {
        const admin = ctx.supabaseAdmin
        const { data: existing, error } = await admin
          .from('platform_identities')
          .select('user_id')
          .eq('platform_user_id', identity.userId)
          .maybeSingle()
        if (error) throw error
        let userId: string | undefined = existing?.user_id
        let email = `${identity.userId}@platform.invalid`
        if (userId) {
          const { data, error: userError } = await admin.auth.admin.getUserById(userId)
          if (userError || !data.user?.email) throw new Error('Unable to load assistant identity')
          email = data.user.email
        } else {
          // Stable, non-user-editable address makes an interrupted first exchange recoverable.
          await admin.auth.admin.createUser({
            email,
            email_confirm: true,
            app_metadata: { platform_user_id: identity.userId },
          })
        }
        const { data: link, error: linkError } = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email,
        })
        if (
          linkError ||
          !link.properties?.hashed_token ||
          !link.user ||
          link.user.app_metadata.platform_user_id !== identity.userId ||
          (userId && link.user.id !== userId)
        ) {
          throw new Error('Unable to establish assistant identity')
        }
        userId = link.user.id
        const { error: identityError } = await admin
          .from('platform_identities')
          .upsert(
            { platform_user_id: identity.userId, user_id: userId },
            { onConflict: 'platform_user_id' }
          )
        if (identityError) throw identityError
        const { data, error: sessionError } = await ctx.supabase.auth.verifyOtp({
          type: 'email',
          token_hash: link.properties.hashed_token,
        })
        if (sessionError || !data.session || data.session.user.id !== userId)
          throw new Error('Unable to create assistant session')
        return Response.json(
          {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            user_id: userId,
            platform_user_id: identity.userId,
          },
          { headers: { 'cache-control': 'no-store' } }
        )
      })
    },
  },
  {
    method: 'GET',
    pattern: '/oauth/start',
    auth: 'user',
    handler: async (request, ctx) => {
      const userId = requireUserId(ctx)
      await checkRateLimit(`oauth:${userId}`, 10)
      const url = new URL(request.url)
      const params = z
        .object({
          org_slug: z.string().min(1),
          code_challenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
          return_to: z.string().url(),
        })
        .safeParse(Object.fromEntries(url.searchParams))
      if (!params.success || !isAllowedOrigin(new URL(params.data.return_to).origin))
        throw new HttpError(400, 'invalid_request', 'Invalid connection request.')
      const { org_slug: orgSlug, code_challenge: codeChallenge, return_to: returnTo } = params.data
      const state = generateOAuthState()
      await adminQuery('delete from public.oauth_states where user_id=$1 and expires_at < now()', [
        userId,
      ])
      await adminQuery(
        `insert into public.oauth_states(state,user_id,org_slug,code_challenge,return_to,expires_at)
      values ($1,$2,$3,$4,$5,now()+interval '15 minutes')`,
        [state, userId, orgSlug, codeChallenge, returnTo]
      )
      return Response.json(
        { state, authorize_url: buildAuthorizeUrl({ state, codeChallenge, orgSlug }) },
        { headers: { 'cache-control': 'no-store' } }
      )
    },
  },
  {
    method: 'GET',
    pattern: '/oauth/callback',
    auth: 'none',
    handler: async (request) => {
      const url = new URL(request.url)
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      if (!code || !state)
        throw new HttpError(
          400,
          'invalid_request',
          'Invalid connection response. Start the connection again.'
        )
      const [stored] = await adminQuery<{ return_to: string }>(
        'select return_to from public.oauth_states where state=$1 and expires_at>now()',
        [state]
      )
      if (!stored || !isAllowedOrigin(new URL(stored.return_to).origin))
        throw new HttpError(400, 'invalid_request', 'Connection request expired. Start again.')
      // No token exchange here. Only the initiating window holds the verifier
      // and can complete this flow with its authenticated assistant identity.
      return new Response(buildOAuthCodeHtml({ code, state, returnTo: stored.return_to }), {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
          'referrer-policy': 'no-referrer',
        },
      })
    },
  },
  {
    method: 'POST',
    pattern: '/oauth/complete',
    auth: 'user',
    handler: async (request, ctx) => {
      const userId = requireUserId(ctx)
      const body = await parseBody(
        request,
        z.object({
          state: z.string().min(1),
          code: z.string().min(1),
          code_verifier: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/),
        })
      )
      const challenge = createHash('sha256').update(body.code_verifier).digest('base64url')
      const [stored] = await adminQuery<{ org_slug: string }>(
        `delete from public.oauth_states
      where state=$1 and user_id=$2 and code_challenge=$3 and expires_at>now() returning org_slug`,
        [body.state, userId, challenge]
      )
      if (!stored)
        throw new HttpError(
          400,
          'invalid_request',
          'Connection request expired or belongs to another session. Start again.'
        )
      const tokens = await exchangeCode({ code: body.code, codeVerifier: body.code_verifier })
      const organizations = z
        .array(z.object({ slug: z.string() }))
        .parse(await createManagementApi(tokens.access_token).listOrganizations())
      if (!organizations.some((org) => org.slug === stored.org_slug))
        throw new HttpError(403, 'unauthorized', 'Connect the organization selected for Assistant.')
      await withAdvisoryLock(`oauth:${userId}:${stored.org_slug}`, () =>
        storeOAuthTokens({
          userId,
          orgSlug: stored.org_slug,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokenExpiresAt(tokens),
          scopes: tokenScopes(tokens),
        })
      )
      return Response.json({ org_slug: stored.org_slug })
    },
  },
]
