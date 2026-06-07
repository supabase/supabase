import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { getProjectClient } from '@/lib/console-bff'


const wrappedHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

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
  const { path, expiresIn = 60 * 60 * 24 } = req.body

  const supabase = await getProjectClient(req, String(req.query.ref ?? ''))
  if (!supabase) return res.status(503).json({ error: { message: 'Project is not running' } })

  const { data, error } = await supabase.storage
    .from(id as string)
    .createSignedUrls(path, expiresIn)

  if (error) {
    return res.status(400).json({ error: { message: error.message } })
  }

  // [console fork] Per-project client already returns the project's kong URLs.
  return res.status(201).json(data ?? [])
}

export default wrappedHandler
