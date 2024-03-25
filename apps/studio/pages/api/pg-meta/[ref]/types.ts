import { NextApiRequest, NextApiResponse } from 'next'
import { PG_META_URL } from 'lib/constants'
import apiWrapper from 'lib/api/apiWrapper'
import { constructHeaders } from 'lib/api/apiHelpers'
import { get } from 'lib/common/fetch'

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  const response = await get(`${PG_META_URL}/types`, { headers })

  const includeSystemSchemas = req.query['include_system_schemas'] === 'true'

  if (response.error) {
    return res.status(400).json({ error: response.error })
  }

  if (!includeSystemSchemas) {
    const types = response?.filter((x: any) => x.schema === 'public')
    return res.status(200).json(types)
  }

  return res.status(200).json(response)
}
