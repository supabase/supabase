import { NextApiRequest, NextApiResponse } from 'next'

import { fetchGet } from '@/data/fetchers'
import { constructHeaders } from '@/lib/api/apiHelpers'
import { apiWrapper } from '@/lib/api/apiWrapper'
import { getPgMetaConnectionHeaders } from '@/lib/api/self-hosted/pg-meta-headers'
import { PG_META_URL } from '@/lib/constants'

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
  const { ref } = req.query as { ref: string }
  const headers = constructHeaders(req.headers)
  const pgMetaHeaders = getPgMetaConnectionHeaders(ref, headers)
  const response = await fetchGet(getPgMetaRedirectUrl(req, 'tables'), { headers: pgMetaHeaders })

  if ((response as any).error) {
    const { code, message } = (response as any).error
    return res.status(typeof code === 'number' ? code : 500).json({ message })
  } else {
    return res.status(200).json(response)
  }
}
