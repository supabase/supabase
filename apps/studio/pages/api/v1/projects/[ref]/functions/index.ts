import { NextApiRequest, NextApiResponse } from 'next'

import { uuidv4 } from 'lib/helpers'
import apiWrapper from 'lib/api/apiWrapper'
import { components } from 'api-types'
import { getFunctionsArtifactStore } from 'lib/api/self-hosted/functions'

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

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

type EdgeFunctionsResponse = components['schemas']['FunctionResponse']

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const { store, error } = getFunctionsArtifactStore()
  if (!store || error) {
    return res.status(500).json({ error })
  }

  const functionsArtifacts = await store.getFunctions()
  if (!functionsArtifacts) return res.status(200).json([])

  // mix some mock data
  const functions = functionsArtifacts.map(
    (func) =>
      ({
        id: uuidv4(),
        slug: func.slug,
        version: 1,
        name: func.slug,
        status: 'ACTIVE',
        entrypoint_path: func.entrypoint_path,
        created_at: func.created_at,
        updated_at: func.updated_at,
      }) satisfies EdgeFunctionsResponse
  )

  return res.status(200).json(functions)
}
