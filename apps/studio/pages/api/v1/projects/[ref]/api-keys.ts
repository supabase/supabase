import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import {
  applyRevealToApiKey,
  getNonPlatformApiKeys,
  parseRevealQuery,
} from '@/lib/api/self-hosted/api-keys'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const reveal = parseRevealQuery(req.query.reveal)
  const response = getNonPlatformApiKeys().map((key) => applyRevealToApiKey(key, reveal))

  return res.status(200).json(response)
}
