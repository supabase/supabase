import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { DEFAULT_PROJECT, PROJECT_ENDPOINT } from 'pages/api/constants'

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

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  // Platform specific endpoint
  const response = {
    project: {
      ...DEFAULT_PROJECT,
      cloud_provider: 'AWS',
      region: 'ap-southeast-1',
      db_dns_name: '-',
      db_host: 'localhost',
      db_name: 'postgres',
      db_port: 5432,
      db_ssl: false,
      db_user: 'postgres',
      jwt_secret: '-',
    },
    services: [
      {
        id: 1,
        name: 'Default API',
        service_api_keys: [
          {
            api_key: process.env.SUPABASE_SERVICE_KEY,
            api_key_encrypted: '-',
            name: 'service_role key',
            tags: 'service_role',
          },
          {
            api_key: process.env.SUPABASE_ANON_KEY,
            api_key_encrypted: '-',
            name: 'anon key',
            tags: 'anon',
          },
        ],
        app: { id: 1, name: 'Auto API' },
        app_config: {
          db_schema: 'public',
          endpoint: PROJECT_ENDPOINT,
          realtime_enabled: true,
        },
      },
    ],
  }

  return res.status(200).json(response)
}
