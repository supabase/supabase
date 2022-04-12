import { NextApiRequest, NextApiResponse } from 'next'

import { IS_PLATFORM } from 'lib/constants'
import apiWrapper from 'lib/api/apiWrapper'
import { createEncryptedDbConnectionString } from 'lib/api/apiHelpers'

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
    id: 1,
    primary_email: 'johndoe@supabase.io',
    username: 'johndoe',
    first_name: 'John',
    last_name: 'Doe',
    organizations: [
      {
        id: 1,
        name: 'Default Organization' || process.env.DEFAULT_ORGANIZATION_NAME,
        slug: 'default-org-slug',
        billing_email: 'billing@supabase.co',
        projects: [
          {
            id: 1,
            ref: 'default',
            name: 'Default Project' || process.env.DEFAULT_PROJECT_NAME,
            organization_id: 1,
            cloud_provider: 'localhost',
            status: 'ACTIVE_HEALTHY',
            region: 'local',
            connectionString: IS_PLATFORM
              ? createEncryptedDbConnectionString({
                  db_user_supabase: 'postgres',
                  db_dns_name: undefined,
                  db_host: 'localhost',
                  db_pass_supabase: String(process.env.POSTGRES_PASSWORD),
                  db_port: 5432,
                  db_name: 'postgres',
                  db_ssl: false,
                })
              : '',
          },
        ],
      },
    ],
  }
  return res.status(200).json(response)
}
