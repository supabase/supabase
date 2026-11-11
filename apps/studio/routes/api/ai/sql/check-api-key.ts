import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'

import { toWebHandler } from '@/compat/next/api'
import { apiWrapper } from '@/lib/api/apiWrapper'

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

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
  if (process.env.OPENAI_API_KEY) {
    return res.status(200).json({ hasKey: true })
  } else {
    return res.status(200).json({ hasKey: false })
  }
}

const webHandler = toWebHandler(wrapper)

export const Route = createFileRoute('/api/ai/sql/check-api-key')({
  server: { handlers: { GET: webHandler } },
})
