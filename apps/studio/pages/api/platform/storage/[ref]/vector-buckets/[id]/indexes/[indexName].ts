import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

// eslint-disable-next-line import/no-anonymous-default-export
export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'DELETE':
      return handleDelete(req, res)

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}
const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id, indexName } = req.query

  const { data, error } = await supabase.storage.vectors
    .from(id as string)
    .deleteIndex(indexName as string)

  if (error) return res.status(400).json({ error: { message: error.message } })
  return res.status(200).json(data)
}
