import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'

import { toWebHandler } from '@/compat/next/api'
import { apiWrapper } from '@/lib/api/apiWrapper'

const nextHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handlePost = async (_req: NextApiRequest, res: NextApiResponse) => {
  // Platform specific endpoint
  const response = {}
  return res.status(200).json(response)
}

const webHandler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/telemetry/event')({
  server: { handlers: { POST: webHandler } },
})
