import type { JwtPayload } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { getAssistantProjectAccess } from '@/lib/assistant/project-access'
import { IS_PLATFORM } from '@/lib/constants'
import { auth } from '@/lib/gotrue'
import { getServerFlags, trustedUserEmail } from '@/lib/server/configcat'

const bodySchema = z
  .object({
    projectRef: z.string().min(1).optional(),
    orgSlug: z.string().min(1).optional(),
  })
  .refine((body) => !!body.projectRef === !!body.orgSlug)

async function handler(req: NextApiRequest, res: NextApiResponse, claims?: JwtPayload) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })
  if (!IS_PLATFORM || !claims?.sub || claims.aud !== 'authenticated') {
    return res.status(403).json({ message: 'Assistant access is unavailable.' })
  }
  const body = bodySchema.safeParse(req.body)
  if (!body.success) return res.status(400).json({ message: 'Invalid project context.' })

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  const { data, error } = await auth.getUser(token)
  if (error || data.user?.id !== claims.sub) {
    return res.status(401).json({ message: 'Sign in to continue.' })
  }
  if (data.user.factors?.some((factor) => factor.status === 'verified') && claims.aal !== 'aal2') {
    return res.status(403).json({ message: 'Complete two-factor authentication to continue.' })
  }
  const isLocalOverride =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' &&
    process.env.NEXT_PUBLIC_ASSISTANT_BACKEND === 'true'
  const flags = await getServerFlags(trustedUserEmail(claims.email))
  const isEnabled =
    isLocalOverride ||
    flags.some(
      (flag) => flag.settingKey === 'assistantSupabaseBackend' && flag.settingValue === true
    )
  if (!isEnabled) return res.status(403).json({ message: 'Assistant access is unavailable.' })

  if (!body.data.projectRef || !body.data.orgSlug) {
    return res.json({
      userId: claims.sub,
      canShareProjectData: false,
      hasAccessToAdvanceModel: false,
    })
  }
  const { projectRef, orgSlug } = body.data
  const policy = await getAssistantProjectAccess({
    projectRef,
    orgSlug,
    authorization: req.headers.authorization!,
  })
  if (policy.orgSlug !== orgSlug) {
    return res.status(403).json({ message: 'You do not have access to this project.' })
  }
  return res.json({
    userId: claims.sub,
    projectRef,
    orgSlug,
    // Assistant consent is stored in the Assistant project, independently of legacy org opt-in.
    canShareProjectData:
      policy.hasHipaaAddon === false ||
      (policy.hasHipaaAddon === true && policy.isSensitive === false),
    hasAccessToAdvanceModel: policy.hasAccessToAdvanceModel && process.env.IS_THROTTLED === 'false',
  })
}

export default function assistantPolicy(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler, { withAuth: true })
}
