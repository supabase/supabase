import { type NextApiRequest, type NextApiResponse } from 'next'

import type { components } from 'api-types'
import { uuidv4 } from 'lib/helpers'
import apiWrapper from 'lib/api/apiWrapper'
import { getFunctionsArtifactStore } from 'lib/api/self-hosted/functions'

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

type EdgeFunctionsResponse = components['schemas']['FunctionResponse']

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const slugParam = req.query.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
  if (!slug)
    return res.status(404).json({ error: { message: `Missing function 'slug' parameter` } })

  const store = getFunctionsArtifactStore()

  const functionsArtifact = await store.getFunctionBySlug(slug)
  if (!functionsArtifact) return res.status(404).json({ error: { message: `Function not found` } })

  const functionResponse = {
    id: uuidv4(),
    slug: functionsArtifact.slug,
    version: 1,
    name: functionsArtifact.slug,
    status: 'ACTIVE',
    entrypoint_path: functionsArtifact.entrypoint_path,
    created_at: functionsArtifact.created_at,
    updated_at: functionsArtifact.updated_at,
  } satisfies EdgeFunctionsResponse

  return res.status(200).json(functionResponse)
}
