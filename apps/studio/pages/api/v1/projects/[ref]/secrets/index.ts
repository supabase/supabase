import { type NextApiRequest, type NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { getFunctionsSecretsStore } from '@/lib/api/self-hosted/functions'

export default function handlerWithErrorCatching(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler, { withAuth: true })
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'POST':
      return handlePost(req, res)
    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (_req: NextApiRequest, res: NextApiResponse) => {
  const store = getFunctionsSecretsStore()
  const secrets = await store.listSecrets()
  return res.status(200).json(secrets)
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const body = req.body
  if (!Array.isArray(body) || body.some((s) => typeof s?.name !== 'string')) {
    return res
      .status(400)
      .json({ error: { message: 'Expected an array of { name, value } secrets' } })
  }

  const secrets = body.map((s) => ({ name: String(s.name), value: String(s.value ?? '') }))

  const store = getFunctionsSecretsStore()
  const created = await store.upsertSecrets(secrets)
  return res.status(201).json(created)
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const body = req.body
  if (!Array.isArray(body) || body.some((name) => typeof name !== 'string')) {
    return res.status(400).json({ error: { message: 'Expected an array of secret names' } })
  }

  const store = getFunctionsSecretsStore()
  await store.deleteSecrets(body)
  return res.status(200).json({})
}
