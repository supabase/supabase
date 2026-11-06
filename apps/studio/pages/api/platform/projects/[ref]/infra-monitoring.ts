import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'

const route = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)
export default route

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

const handleGetAll = async (_req: NextApiRequest, res: NextApiResponse) => {
  // Platform specific endpoint
  const response = {
    data: [],
    yAxisLimit: 0,
    format: '%',
    total: 0,
  }
  return res.status(200).json(response)
}
