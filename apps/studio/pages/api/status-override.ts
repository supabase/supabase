import { IS_PLATFORM } from 'common'
import { NextApiRequest, NextApiResponse } from 'next'

type ResponseData = { enabled: boolean }

export default function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (!IS_PLATFORM) {
    return res.status(404).end()
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end()
  }

  return res.status(200).json({
    enabled: process.env.NEXT_PUBLIC_ONGOING_INCIDENT === 'true',
  })
}
