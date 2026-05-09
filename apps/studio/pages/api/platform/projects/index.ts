import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { getProjects } from '@/lib/api/self-hosted/projects'
import { IS_PLATFORM } from '@/lib/constants'

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
  if (IS_PLATFORM) {
    return res.status(404).json({ error: { message: 'Not found' } })
  }

  const projects = getProjects()
  const response = projects.map((p) => ({
    id: p.id,
    ref: p.ref,
    name: p.name,
    organization_id: p.organizationId,
    cloud_provider: 'localhost',
    status: 'ACTIVE_HEALTHY',
    region: 'local',
    inserted_at: '2021-08-02T06:40:40.646Z',
  }))

  return res.status(200).json(response)
}
