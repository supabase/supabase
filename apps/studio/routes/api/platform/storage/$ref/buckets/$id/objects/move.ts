import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'

import { toWebHandler } from '@/compat/next/api'
import { apiWrapper } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

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

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query
  const { from, to } = req.body

  const { data, error } = await supabase.storage.from(id as string).move(from, to)
  if (error) {
    return res.status(400).json({ error: { message: error.message } })
  }

  return res.status(200).json(data)
}

const webHandler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/storage/$ref/buckets/$id/objects/move')({
  server: { handlers: { POST: webHandler } },
})
