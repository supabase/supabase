import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'

import { toWebHandler } from '@/compat/next/api'
import { apiWrapper } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

function listV2Route(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler)
}

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

  const { data, error } = await supabase.storage.from(id as string).listV2(req.body)
  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json(data)
}

const webHandler = toWebHandler(listV2Route)

export const Route = createFileRoute('/api/platform/storage/$ref/buckets/$id/objects/list-v2')({
  server: { handlers: { POST: webHandler } },
})
