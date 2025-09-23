import { NextApiRequest, NextApiResponse } from 'next'

import { constructHeaders } from 'lib/api/apiHelpers'
import apiWrapper from 'lib/api/apiWrapper'
import { applyAndTrackMigrations, listMigrationVersions } from 'lib/api/self-hosted/migrations'

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  const { data, error } = await listMigrationVersions(headers)

  if (error) {
    const { code, message } = error
    return res.status(code ?? 500).json({ message })
  } else {
    return res.status(200).json(data)
  }
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  const { query, name } = req.body

  const { data, error } = await applyAndTrackMigrations({ query, name, headers })

  if (error) {
    const { code, message } = error
    return res.status(code ?? 500).json({ message, formattedError: message })
  } else {
    return res.status(200).json(data)
  }
}
