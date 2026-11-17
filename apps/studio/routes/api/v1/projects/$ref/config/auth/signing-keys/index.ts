import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'

import { toWebHandler } from '@/compat/next/api'
import { apiWrapper } from '@/lib/api/apiWrapper'
import { getLegacySigningKey } from '@/lib/api/self-hosted/signing-keys'

function signingKeys(req: NextApiRequest, res: NextApiResponse) {
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
  return res.status(200).json({ keys: [getLegacySigningKey()] })
}

const webHandler = toWebHandler(signingKeys)

export const Route = createFileRoute('/api/v1/projects/$ref/config/auth/signing-keys/')({
  server: { handlers: { GET: webHandler } },
})
