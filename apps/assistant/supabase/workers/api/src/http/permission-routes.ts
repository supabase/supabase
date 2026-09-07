import { z } from 'zod'

import { getProjectPermissions, setProjectPermissions } from '../db/project-permissions'
import {
  ASSISTANT_CONSENT_VERSION,
  presentProjectPermissions,
  projectPermissionLevelSchema,
} from '../permissions'
import { getPlatformPolicy } from '../platform/policy'
import { requireUserId } from './auth'
import { HttpError } from './errors'
import { parseBody } from './request'
import type { Route } from './routes'

export const permissionRoutes: Route[] = [
  {
    method: 'GET',
    pattern: '/v1/projects/:ref/permissions',
    auth: 'user',
    handler: async (req, ctx, params) => {
      const orgSlug = new URL(req.url).searchParams.get('org_slug')
      if (!orgSlug) throw new HttpError(400, 'invalid_request', 'Organization is required.')
      const policy = await getPlatformPolicy(
        ctx.platformToken!,
        { projectRef: params.ref, orgSlug },
        req.signal
      )
      return Response.json(
        presentProjectPermissions(
          await getProjectPermissions(
            requireUserId(ctx),
            params.ref,
            orgSlug,
            policy.canShareProjectData
          )
        )
      )
    },
  },
  {
    method: 'POST',
    pattern: '/v1/projects/:ref/permissions',
    auth: 'user',
    handler: async (req, ctx, params) => {
      const body = await parseBody(
        req,
        z.object({
          org_slug: z.string().min(1),
          selection: projectPermissionLevelSchema,
          consentVersion: z.literal(ASSISTANT_CONSENT_VERSION),
        })
      )
      const policy = await getPlatformPolicy(
        ctx.platformToken!,
        { projectRef: params.ref, orgSlug: body.org_slug },
        req.signal
      )
      if (!policy.canShareProjectData && body.selection !== 'disabled')
        throw new HttpError(403, 'unauthorized', 'Data sharing is unavailable for this project.')
      await setProjectPermissions(requireUserId(ctx), params.ref, body.org_slug, body.selection)
      return Response.json(
        presentProjectPermissions(
          await getProjectPermissions(
            requireUserId(ctx),
            params.ref,
            body.org_slug,
            policy.canShareProjectData
          )
        )
      )
    },
  },
]
