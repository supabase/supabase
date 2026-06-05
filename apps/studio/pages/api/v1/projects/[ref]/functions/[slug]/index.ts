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
      return handleGet(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const slugParam = req.query.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
  if (!slug)
    return res.status(404).json({ error: { message: `Missing function 'slug' parameter` } })

  const store = getFunctionsArtifactStore()

  const functionsArtifact = await store.getFunctionBySlug(slug)
  if (!functionsArtifact) return res.status(404).json({ error: { message: `Function not found` } })

  return res.status(200).json(mapArtifactToFunctionResponse(functionsArtifact))
}
