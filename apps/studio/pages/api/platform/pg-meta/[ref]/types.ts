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

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  let pgMetaUrl: string
  try {
    pgMetaUrl = getPgMetaUrlByRef(req.query.ref)
  } catch (err: any) {
    if (err?.statusCode === 404) {
      return res.status(404).json({ error: { message: err.message } })
    }
    throw err
  }
  const response = await fetchGet(`${pgMetaUrl}/types`, { headers })

  if (response.error) {
    const { code, message } = response.error
    return res.status(code).json({ message })
  } else {
    return res.status(200).json(response)
  }
}
