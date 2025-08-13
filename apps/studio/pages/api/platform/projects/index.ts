import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { DEFAULT_PROJECT, DEFAULT_PROJECT_2, IS_VELA_PLATFORM } from '../../constants'
import { getVelaClient } from '../../../../data/vela/vela'
import { mapProject } from '../../../../data/vela/api-mappers'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'POST':
      return handleCreate(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleCreate = async (req: NextApiRequest, res: NextApiResponse) => {}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!IS_VELA_PLATFORM) {
    // Platform specific endpoint
    const response = [DEFAULT_PROJECT, DEFAULT_PROJECT_2]
    return res.status(200).json(response)
  }

  const header = req.headers['x-vela-organization-id']
  if (!header) {
    return res.status(400).send('Missing organization id')
  }
  const organizationId = parseInt(Array.isArray(header) ? header[0] : header)

  const client = getVelaClient()
  const response = await client.GET('/organizations/{organization_id}/projects/', {
    params: {
      path: {
        organization_id: organizationId,
      },
    },
  })

  if (response.response.status !== 200 || !response.data) {
    return res.status(response.response.status).send(response.error)
  }

  return res.status(200).json(response.data.map(mapProject))
}
