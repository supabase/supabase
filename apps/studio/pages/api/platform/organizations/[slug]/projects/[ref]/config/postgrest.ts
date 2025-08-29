import { components } from 'api-types'
import apiWrapper from '../../../../../../../../lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from '../../../../../../../../lib/api/apiBuilder'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const responseObj: components['schemas']['GetPostgrestConfigResponse'] = {
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

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({})
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).patch(handlePatch)
})

export default apiHandler
