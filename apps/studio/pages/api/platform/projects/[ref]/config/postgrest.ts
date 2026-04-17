import { components } from 'api-types'
import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'

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
  const responseObj: components['schemas']['GetPostgrestConfigResponse'] = {
    db_anon_role: 'anon',
    db_extra_search_path: process.env.PGRST_DB_EXTRA_SEARCH_PATH ?? 'public',
    db_schema: process.env.PGRST_DB_SCHEMAS ?? 'public,storage,graphql_public',
    jwt_secret:
      process.env.AUTH_JWT_SECRET ?? 'super-secret-jwt-token-with-at-least-32-characters-long',
    max_rows: Number(process.env.PGRST_DB_MAX_ROWS) || 1000,
    role_claim_key: '.role',
  }

  return res.status(200).json(responseObj)
}
