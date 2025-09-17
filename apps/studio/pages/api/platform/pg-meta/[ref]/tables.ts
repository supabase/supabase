import { NextApiRequest, NextApiResponse } from 'next'

import { fetchGet } from 'data/fetchers'
import { constructHeaders } from 'lib/api/apiHelpers'
import apiWrapper from 'lib/api/apiWrapper'
import { PG_META_URL } from 'lib/constants'

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

/**
 * Construct the pgMeta redirection url passing along the filtering query params
 * @param req
 * @param endpoint
 */
export function getPgMetaRedirectUrl(req: NextApiRequest, endpoint: string) {
  const query = Object.entries(req.query).reduce((query, entry) => {
    const [key, value] = entry
    if (Array.isArray(value)) {
      for (const v of value) {
        query.append(key, v)
      }
    } else if (value) {
      query.set(key, value)
    }
    return query
  }, new URLSearchParams())

  let url = `${PG_META_URL}/${endpoint}`
  if (Object.keys(req.query).length > 0) {
    url += `?${query}`
  }
  return url
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  const response = await fetchGet(getPgMetaRedirectUrl(req, 'tables'), { headers })

  if (response.error) {
    const { code, message } = response.error
    return res.status(code).json({ message })
  } else {
    return res.status(200).json(response)
  }
}
