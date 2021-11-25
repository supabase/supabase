import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'
import { Member } from 'types'

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
  const owner: Member = {
    id: 1,
    is_owner: true,
    profile: {
      id: 1,
      primary_email: 'jonny@supabase.io',
      username: 'mildtomato',
    },
  }
  const member: Member = {
    id: 2,
    is_owner: false,
    profile: {
      id: 2,
      primary_email: 'joshen@supabase.io',
      username: 'joshen',
    },
  }
  // Platform specific endpoint
  const response = {
    members: [owner, member],
    products: [],
    customer: {
      customer: {},
      subscriptions: {},
      total_paid_projects: 0,
      total_free_projects: 0,
      total_pro_projects: 0,
      total_payg_projects: 0,
    },
  }

  return res.status(200).json(response)
}
