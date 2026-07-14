import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { getNonPlatformApiKeyById, parseRevealQuery } from '@/lib/api/self-hosted/api-keys'

const apiKeyByIdRoute = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default apiKeyByIdRoute

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const idParam = req.query.id
  const id = Array.isArray(idParam) ? idParam[0] : idParam

  if (!id) {
    return res.status(404).json({ error: { message: 'API key not found' } })
  }

  const reveal = parseRevealQuery(req.query.reveal)
  const apiKey = getNonPlatformApiKeyById(id, reveal)

  if (!apiKey) {
    return res.status(404).json({ error: { message: 'API key not found' } })
  }

  return res.status(200).json(apiKey)
}
