import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { getProject } from '@/lib/api/self-hosted/projects'
import { IS_PLATFORM } from '@/lib/constants'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

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
  if (IS_PLATFORM) {
    return res.status(404).json({ error: { message: 'Not found' } })
  }

  let project
  try {
    project = getProject(req.query.ref)
  } catch (err: any) {
    if (err?.statusCode === 404) {
      return res.status(404).json({ error: { message: err.message } })
    }
    throw err
  }

  const response = {
    id: project.id,
    ref: project.ref,
    name: project.name,
    organization_id: project.organizationId,
    cloud_provider: 'localhost',
    status: 'ACTIVE_HEALTHY',
    region: 'local',
    inserted_at: '2021-08-02T06:40:40.646Z',
    connectionString: '',
    restUrl: project.supabaseRestUrl,
  }

  return res.status(200).json(response)
}
