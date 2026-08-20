import { paths } from 'api-types'
import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { POSTGRES_PORT } from '@/lib/api/self-hosted/constants'
import { PROJECT_DB_HOST, PROJECT_DB_HOST_DIRECT, PROJECT_REST_URL } from '@/lib/constants/api'

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

const handleGet = async (_req: NextApiRequest, res: NextApiResponse<ResponseData>) => {
  // db_host stays the public gateway host (where Supavisor is exposed); the
  // direct connection points at Postgres itself, which the operator can host
  // elsewhere via POSTGRES_HOST — see PROJECT_DB_HOST_DIRECT.
  const databases: (ResponseData[number] & { db_host_direct?: string })[] = [
    {
      cloud_provider: 'localhost' as any,
      connectionString: '',
      connection_string_read_only: '',
      db_host: PROJECT_DB_HOST,
      db_host_direct: PROJECT_DB_HOST_DIRECT,
      db_name: 'postgres',
      db_port: POSTGRES_PORT,
      db_user: 'postgres',
      identifier: 'default',
      inserted_at: '',
      region: 'local',
      restUrl: PROJECT_REST_URL,
      size: '',
      status: 'ACTIVE_HEALTHY',
    },
  ]

  return res.status(200).json(databases)
}
