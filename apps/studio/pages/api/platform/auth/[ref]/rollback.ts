import { NextApiRequest, NextApiResponse } from 'next'
import { validateProjectRef } from '@/lib/self-hosted-auth/project-registry'
import { requestManager } from '@/lib/self-hosted-auth/manager-client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const refError = validateProjectRef(req.query.ref as string)
  if (refError) {
    return res.status(400).json({ error: refError })
  }

  if (req.method === 'POST') {
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
