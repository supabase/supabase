import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { getProject } from '@/lib/api/self-hosted/projects'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handleGet(req, res)

    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  let project
  try {
    project = getProject(req.query.ref)
  } catch (err: any) {
    if (err?.statusCode === 404) {
      return res.status(404).json({ error: { message: err.message } })
    }
    throw err
  }

  const authorizationHeader = req.headers['x-graphql-authorization']

  const response = await fetch(`${project.supabaseUrl}/graphql/v1`, {
    method: 'POST',
    headers: {
      apikey: project.serviceKey,
      Authorization:
        (Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader) ??
        `Bearer ${project.anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  })
  if (response.ok) {
    const data = await response.json()

    return res.status(200).json(data)
  }

  return res.status(500).json({ error: { message: 'Internal Server Error' } })
}
