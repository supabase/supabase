import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { proxyManagementApi } from '@/lib/api/self-hosted/management-api'

export default function handleEndpoint(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler)
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const { ref, template } = req.query

  switch (method) {
    case 'GET':
    case 'PUT':
      return proxyManagementApi(req, res, `/platform/auth/${ref}/templates/${template}/react`)
    default:
      res.setHeader('Allow', ['GET', 'PUT'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}
