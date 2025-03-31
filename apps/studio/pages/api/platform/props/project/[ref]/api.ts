import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import {
  DEFAULT_PROJECT,
  PROJECT_ENDPOINT,
  PROJECT_ENDPOINT_PROTOCOL,
  PROJECT_REST_URL,
} from 'pages/api/constants'

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
      api_key_supabase_encrypted: '',
      db_host: 'localhost',
      db_name: 'postgres',
      db_port: 5432,
      db_ssl: false,
      db_user: 'postgres',
      services: [
        {
          id: 1,
          name: 'Default API',
          app: { id: 1, name: 'Auto API' },
          app_config: {
            db_schema: 'public',
            endpoint: PROJECT_ENDPOINT,
            realtime_enabled: true,
          },
          service_api_keys: [
            {
              api_key_encrypted: '-',
              name: 'service_role key',
              tags: 'service_role',
            },
            {
              api_key_encrypted: '-',
              name: 'anon key',
              tags: 'anon',
            },
          ],
        },
      ],
    },
    autoApiService: {
      id: 1,
      name: 'Default API',
      project: { ref: 'default' },
      app: { id: 1, name: 'Auto API' },
      app_config: {
        db_schema: 'public',
        endpoint: PROJECT_ENDPOINT,
        realtime_enabled: true,
      },
      protocol: PROJECT_ENDPOINT_PROTOCOL,
      endpoint: PROJECT_ENDPOINT,
      restUrl: PROJECT_REST_URL,
      defaultApiKey: process.env.SUPABASE_ANON_KEY,
      serviceApiKey: process.env.SUPABASE_SERVICE_KEY,
      service_api_keys: [
        {
          api_key_encrypted: '-',
          name: 'service_role key',
          tags: 'service_role',
        },
        {
          api_key_encrypted: '-',
          name: 'anon key',
          tags: 'anon',
        },
      ],
    },
  }

  return res.status(200).json(response)
}
