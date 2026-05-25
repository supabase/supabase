import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { STORAGE_S3_ACCESS_KEY } from '@/lib/api/self-hosted/constants'

export default function credentials(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler)
}

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

const handleGet = async (_req: NextApiRequest, res: NextApiResponse) => {
  const accessKeyId = STORAGE_S3_ACCESS_KEY
  const data = accessKeyId
    ? [
        {
          id: accessKeyId,
          description: 'Default',
          access_key: accessKeyId,
        },
      ]
    : []
  return res.status(200).json({ data })
}
