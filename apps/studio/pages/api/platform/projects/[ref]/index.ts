import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { DEFAULT_PROJECT, PROJECT_REST_URL } from '@/lib/constants/api'
import { getDatabaseByRef } from '@/lib/api/self-hosted/registry'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

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

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = req.query as { ref: string }

  // Try to resolve the project from the multi-database registry first.
  const db = getDatabaseByRef(ref)
  if (db) {
    return res.status(200).json({
      ...DEFAULT_PROJECT,
      id: db.ref,
      ref: db.ref,
      name: db.name,
      restUrl: PROJECT_REST_URL,
      inserted_at: db.created_at ?? DEFAULT_PROJECT.inserted_at,
    })
  }

  // Fallback: single-project mode — return DEFAULT_PROJECT for any ref
  // (original behaviour preserved for backward compat).
  return res.status(200).json({
    ...DEFAULT_PROJECT,
    restUrl: PROJECT_REST_URL,
  })
}