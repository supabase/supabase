import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'

import { toWebHandler } from '@/compat/next/api'

const accessKey = process.env.S3_PROTOCOL_ACCESS_KEY_ID
const secretKey = process.env.S3_PROTOCOL_ACCESS_KEY_SECRET

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({ accessKey: accessKey, secretKey })
}

const webHandler = toWebHandler(handler)

export const Route = createFileRoute('/api/get-s3-keys')({
  server: { handlers: { GET: webHandler } },
})
