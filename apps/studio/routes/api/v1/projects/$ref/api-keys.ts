import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'

import { toWebHandler } from '@/compat/next/api'
import { apiWrapper } from '@/lib/api/apiWrapper'
import {
  applyRevealToApiKey,
  getNonPlatformApiKeys,
  parseRevealQuery,
} from '@/lib/api/self-hosted/api-keys'

const nextHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

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

const webHandler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/v1/projects/$ref/api-keys')({
  server: { handlers: { GET: webHandler } },
})
