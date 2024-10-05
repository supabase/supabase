import { type ApiData } from '@vercel/flags'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ApiData | null>
) {
  // const access = await verifyAccess(request.headers['authorization'])
  // if (!access) return response.status(401).json(null)

  return response.status(200).json({
    overrideEncryptionMode: 'plaintext',
  })
}
