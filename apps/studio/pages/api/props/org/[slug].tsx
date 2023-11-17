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
  const response = {
    members: [],
    products: [],
    customer: {
      customer: {},
      subscriptions: {},
      total_paid_projects: 0,
      total_free_projects: 0,
      total_pro_projects: 0,
      total_team_projects: 0,
      total_payg_projects: 0,
    },
  }

  return res.status(200).json(response)
}
