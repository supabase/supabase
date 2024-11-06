import { NextApiRequest, NextApiResponse } from 'next'

import { components } from 'api-types'
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
  const response: components['schemas']['ProjectSettingsResponse'] = {
    app_config: {
      db_schema: 'public',
      endpoint: '',
    },
    cloud_provider: 'AWS',
    db_dns_name: '',
    db_host: 'localhost',
    dp_ip_addr_config: '',
    db_name: 'postgres',
    // @ts-expect-error API is typed wrongly
    db_port: 5432,
    db_user: 'postgres',
    inserted_at: '2021-08-02T06:40:40.646Z',
    jwt_secret: '',
    name: process.env.DEFAULT_PROJECT_NAME || 'Default Project',
    ref: 'default',
    region: 'ap-southeast-1',
    service_api_keys: [
      {
        api_key: process.env.SUPABASE_SERVICE_KEY ?? '',
        name: 'service_role key',
        tags: 'service_role',
      },
      {
        api_key: process.env.SUPABASE_ANON_KEY ?? '',
        name: 'anon key',
        tags: 'anon',
      },
    ],
    ssl_enforced: false,
    status: 'ACTIVE_HEALTHY',
  }

  return res.status(200).json(response)
}
