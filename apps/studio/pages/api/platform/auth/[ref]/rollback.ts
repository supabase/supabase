import { NextApiRequest, NextApiResponse } from 'next'
import { validateProjectRef } from '@/lib/self-hosted-auth/project-registry'
import { requestManager } from '@/lib/self-hosted-auth/manager-client'
import { IS_PLATFORM, ENABLE_SELF_HOSTED_AUTH_MENU } from '@/lib/constants'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const refError = validateProjectRef(req.query.ref as string)
  if (refError) {
    return res.status(400).json({ error: refError })
  }

  if (req.method === 'POST') {
    if (
      IS_PLATFORM ||
      !ENABLE_SELF_HOSTED_AUTH_MENU ||
      req.headers['content-type'] !== 'application/json' ||
      (process.env.NEXT_PUBLIC_SITE_URL && req.headers.origin !== process.env.NEXT_PUBLIC_SITE_URL)
    ) {
      return res.status(403).json({ error: 'Unauthorized rollback attempt' })
    }

    try {
      const payload = req.body || {}
      if (!payload.revision) {
        return res.status(400).json({ error: 'Revision is required for rollback' })
      }
      
      const response = await requestManager('POST', '/platform/auth/default/rollback', payload)
      return res.status(response.status).json(response.data)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  res.setHeader('Allow', ['POST'])
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
}
