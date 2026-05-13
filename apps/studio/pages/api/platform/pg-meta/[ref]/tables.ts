import { NextApiRequest, NextApiResponse } from 'next'

import { fetchGet } from '@/data/fetchers'
import { constructHeaders } from '@/lib/api/apiHelpers'
import apiWrapper from '@/lib/api/apiWrapper'
import { getPgMetaUrlByRef } from '@/lib/api/self-hosted/projects'

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
 * Construct the pgMeta redirection url passing along the filtering query params.
 * Uses the per-project pg-meta URL derived from `req.query.ref`.
 */
export function getPgMetaRedirectUrl(req: NextApiRequest, endpoint: string) {
  const pgMetaUrl = getPgMetaUrlByRef(req.query.ref)

  const query = Object.entries(req.query).reduce((acc, [key, value]) => {
    // Skip the route param — it's not a pg-meta query parameter.
    if (key === 'ref') return acc
    if (Array.isArray(value)) {
      for (const v of value) {
        acc.append(key, v)
      }
    } else if (value) {
      acc.set(key, value)
    }
    return acc
  }, new URLSearchParams())

  let url = `${pgMetaUrl}/${endpoint}`
  if (query.toString().length > 0) {
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
