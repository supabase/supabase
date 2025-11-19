import { components } from "api-types"
import { getFunctionsArtifactStore } from "lib/api/self-hosted/functions-manager"
import { uuidv4 } from "lib/helpers"
import { NextApiRequest, NextApiResponse } from "next"


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

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { store, error } = getFunctionsArtifactStore();
  if (!store || error) {
    return res.status(404);
  }

  const functionsArtifacts = await store.getFunctions();
  if (!functionsArtifacts) return res.status(200).json([]);

  // mix some mock data
  const functions = functionsArtifacts.map(func => ({
    id: uuidv4(),
    slug: func.slug,
    version: 1,
    name: func.slug,
    status: "ACTIVE",
    entrypoint_path: func.entrypoint_url,
    created_at: 0,
    updated_at: 0,
  }) satisfies EdgeFunctionsResponse);

  return res.status(200).json(functions);
}

export default handler;
