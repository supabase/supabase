import { NextApiRequest, NextApiResponse } from 'next'
import { getProjectDataPlane } from '@/lib/console-bff'

import apiWrapper from '@/lib/api/apiWrapper'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const dp = await getProjectDataPlane(req, String(req.query.ref ?? ''))
  if (!dp) return res.status(503).json({ error: { message: 'Project is not running' } })
  const { method } = req

  switch (method) {
    case 'POST':
      return handleGet(req, res)

    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const authorizationHeader = req.headers['x-graphql-authorization']

  const response = await fetch(`${dp.baseUrl}/graphql/v1`, {
    method: 'POST',
    headers: {
      apikey: dp.serviceKey,
      Authorization:
        (Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader) ??
        `Bearer ${dp.serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  })
  if (response.ok) {
    const data = await response.json()

    return res.status(200).json(data)
  }

  return res.status(500).json({ error: { message: 'Internal Server Error' } })
}
