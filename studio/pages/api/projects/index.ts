import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'

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
  // Platform specific endpoint
  const response = [
    {
      id: 1,
      ref: 'default',
      name: process.env.DEFAULT_PROJECT_NAME || 'Default Project',
      organization_id: 1,
      cloud_provider: 'localhost',
      status: 'ACTIVE_HEALTHY',
      region: 'local',
    },
  ]
  return res.status(200).json(response)
}
