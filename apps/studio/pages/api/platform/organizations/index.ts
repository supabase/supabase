import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { getOrganizations } from '@/lib/api/self-hosted/projects'
import { IS_PLATFORM } from '@/lib/constants'

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

const handleGetAll = async (_req: NextApiRequest, res: NextApiResponse) => {
  if (IS_PLATFORM) {
    return res.status(404).json({ error: { message: 'Not found' } })
  }

  const orgs = getOrganizations()

  const response = orgs.map((org) => ({
    id: org.id,
    name: org.name,
    slug: `${org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${org.id}`,
    billing_email: 'billing@supabase.co',
    plan: {
      id: 'enterprise',
      name: 'Enterprise',
    },
  }))

  return res.status(200).json(response)
}
