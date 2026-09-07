import { NextApiRequest, NextApiResponse } from 'next'

import { getPgMetaRedirectUrl } from './tables'
import { fetchGet } from '@/data/fetchers'
import { constructHeaders } from '@/lib/api/apiHelpers'
import { apiWrapper } from '@/lib/api/apiWrapper'
import { getPgMetaConnectionHeaders } from '@/lib/api/self-hosted/pg-meta-headers'

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
  const { ref } = req.query as { ref: string }
  const headers = constructHeaders(req.headers)
  const pgMetaHeaders = getPgMetaConnectionHeaders(ref, headers)
  const response = await fetchGet(getPgMetaRedirectUrl(req, 'extensions'), {
    headers: pgMetaHeaders,
  })

  if (response.error) {
    const { code, message } = response.error
    return res.status(code).json({ message })
  } else {
    return res.status(200).json(response)
  }
}