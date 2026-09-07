import { NextApiRequest, NextApiResponse } from 'next'

import { constructHeaders } from '@/lib/api/apiHelpers'
import { apiWrapper } from '@/lib/api/apiWrapper'
import { DEFAULT_EXPOSED_SCHEMAS } from '@/lib/api/self-hosted/constants'
import { getLints } from '@/lib/api/self-hosted/lints'
import { getPgMetaConnectionHeaders } from '@/lib/api/self-hosted/pg-meta-headers'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      const { ref } = req.query as { ref: string }
      const headers = constructHeaders(req.headers)
      const pgMetaHeaders = getPgMetaConnectionHeaders(ref, headers)

      const { data, error } = await getLints({
        headers: pgMetaHeaders,
        exposedSchemas: DEFAULT_EXPOSED_SCHEMAS,
      })

      if (error) {
        return res.status(400).json(error)
      } else {
        return res.status(200).json(data)
      }
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}
