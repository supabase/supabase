import { paths } from 'api-types'
import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { getProject } from '@/lib/api/self-hosted/projects'

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

type ResponseData =
  paths['/platform/projects/{ref}/databases']['get']['responses']['200']['content']['application/json']

const handleGet = async (req: NextApiRequest, res: NextApiResponse<ResponseData>) => {
  let project
  try {
    project = getProject(req.query.ref)
  } catch (err: any) {
    if (err?.statusCode === 404) {
      return res.status(404).json({ error: { message: err.message } } as any)
    }
    throw err
  }

  return res.status(200).json([
    {
      cloud_provider: 'localhost' as any,
      connectionString: '',
      connection_string_read_only: '',
      db_host: '127.0.0.1',
      db_name: 'postgres',
      db_port: 5432,
      db_user: 'postgres',
      identifier: project.ref,
      inserted_at: '',
      region: 'local',
      restUrl: project.supabaseRestUrl,
      size: '',
      status: 'ACTIVE_HEALTHY',
    },
  ])
}
