import { type NextApiRequest, type NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import {
  getFunctionsArtifactStore,
  mapArtifactToFunctionResponse,
} from '@/lib/api/self-hosted/functions'

export default function handlerWithErrorCatching(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler, { withAuth: true })
}

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
  const store = getFunctionsArtifactStore()

  const functionsArtifacts = await store.getFunctions()
  if (functionsArtifacts.length === 0) return res.status(200).json([])

  return res.status(200).json(functionsArtifacts.map(mapArtifactToFunctionResponse))
}
