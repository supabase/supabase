import { components } from 'api-types'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

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
  const responseObj: components['schemas']['PostgrestConfigResponse'] = {
    db_anon_role: 'anon',
    db_extra_search_path: 'public',
    db_schema: 'public, storage',
    jwt_secret:
      process.env.AUTH_JWT_SECRET ?? 'super-secret-jwt-token-with-at-least-32-characters-long',
    max_rows: 100,
    role_claim_key: '.role',
  }

  return res.status(200).json(responseObj)
}
