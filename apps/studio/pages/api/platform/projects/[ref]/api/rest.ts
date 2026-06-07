import { NextApiRequest, NextApiResponse } from 'next'
import { getProjectDataPlane } from '@/lib/console-bff'

import apiWrapper from '@/lib/api/apiWrapper'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const dp = await getProjectDataPlane(req, String(req.query.ref ?? ''))
  if (!dp) return res.status(503).json({ error: { message: 'Project is not running' } })
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'HEAD':
      return handleHead(req, res)
    default:
      res.setHeader('Allow', ['GET', 'HEAD'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (_req: NextApiRequest, res: NextApiResponse) => {
  const response = await fetch(`${dp.baseUrl}/rest/v1/`, {
    method: 'GET',
    headers: {
      apikey: dp.serviceKey,
    },
  })
  if (response.ok) {
    const data = await response.json()

    return res.status(200).json(data)
  }

  return res.status(500).json({ error: { message: 'Internal Server Error' } })
}

const handleHead = async (_req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).end()
}
