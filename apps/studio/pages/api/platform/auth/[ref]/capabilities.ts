import { NextApiRequest, NextApiResponse } from 'next'
import { validateProjectRef } from '@/lib/self-hosted-auth/project-registry'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const refError = validateProjectRef(req.query.ref as string)
  if (refError) {
    return res.status(400).json({ error: refError })
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      users: true,
      policies: true,
      urlConfiguration: true,
      emails: true,
      providers: true,
      multiFactor: true,
      sessions: false,
      rateLimits: false,
      attackProtection: false,
      authHooks: false,
      auditLogs: true,
      oauthApps: false,
      oauthServer: false,
      passkeys: false,
      performance: false,
    })
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
}
