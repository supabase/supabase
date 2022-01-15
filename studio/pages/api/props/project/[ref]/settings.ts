import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'

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
      cloud_provider: 'AWS',
      db_dns_name: '-',
      db_host: 'localhost',
      db_name: 'postgres',
      db_port: 5432,
      db_ssl: false,
      db_user: 'postgres',
      id: 1,
      inserted_at: undefined,
      jwt_secret: '-',
      name: 'Default Project',
      ref: 'default',
      region: 'ap-southeast-1',
      status: 'ACTIVE_HEALTHY',
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
          endpoint: process.env.SUPABASE_URL,
          realtime_enabled: true,
        },
      },
    ],
  }

  return res.status(200).json(response)
}
