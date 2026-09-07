import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { DEFAULT_PROJECT } from '@/lib/constants/api'
import { getAllDatabases } from '@/lib/api/self-hosted/registry'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (_req: NextApiRequest, res: NextApiResponse) => {
  // Self-hosted: return all databases from the registry so the project
  // switcher can show every configured database.
  const databases = getAllDatabases()

  if (databases.length > 0) {
    const projects = databases.map((db) => ({
      ...DEFAULT_PROJECT,
      id: db.ref,
      ref: db.ref,
      name: db.name,
      inserted_at: db.created_at ?? DEFAULT_PROJECT.inserted_at,
    }))
    return res.status(200).json(projects)
  }

  // Fallback: single-project mode (original behaviour)
  return res.status(200).json([DEFAULT_PROJECT])
}