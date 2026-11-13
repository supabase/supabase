import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'

import { toWebHandler } from '@/compat/next/api'
import { apiWrapper } from '@/lib/api/apiWrapper'

const nextHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'HEAD':
      return handleHead(req, res)
    default:
      res.setHeader('Allow', ['GET', 'HEAD'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (_req: NextApiRequest, res: NextApiResponse) => {
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
    method: 'GET',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_KEY!,
    },
  })
  if (response.ok) {
    const data = await response.json()

    return res.status(200).json(data)
  }

  return res.status(500).json({ error: { message: 'Internal Server Error' } })
}

const handleHead = async (_req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).end()
}

const webHandler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/projects/$ref/api/rest')({
  server: { handlers: { GET: webHandler, HEAD: webHandler } },
})
