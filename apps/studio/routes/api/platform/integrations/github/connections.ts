import { createFileRoute } from '@tanstack/react-router'
import { paths } from 'api-types'
import { NextApiRequest, NextApiResponse } from 'next'

import { toWebHandler } from '@/compat/next/api'
import { apiWrapper } from '@/lib/api/apiWrapper'

const nextHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

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

type ResponseData =
  paths['/platform/integrations/github/connections']['get']['responses']['200']['content']['application/json']

const handleGet = async (_req: NextApiRequest, res: NextApiResponse<ResponseData>) => {
  return res.status(200).json({ connections: [] })
}

const webHandler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/integrations/github/connections')({
  server: { handlers: { GET: webHandler } },
})
