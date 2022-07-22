import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'

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
  // Platform specific endpoint
  const response = {
    id: 1,
    ref: 'default',
    name: 'Default Project',
    organization_id: 1,
    cloud_provider: 'localhost',
    status: 'ACTIVE_HEALTHY',
    region: 'local',
    connectionString: createDbConnectionString({
      db_user_supabase: 'postgres',
      db_host: 'localhost',
      db_pass_supabase: process.env.POSTGRES_PASSWORD as string,
      db_port: 5432,
      db_name: 'postgres',
      db_ssl: false,
    }),
    kpsVersion: 'kps-v1.0.0',
    restUrl: process.env.SUPABASE_REST_URL || 'http://localhost:8000/rest/v1/',
  }

  return res.status(200).json(response)
}

/**
 * Creates a Postgres connection string using the Supabase master login.
 * Expects the passwords to be encrypted (straight from the DB)
 */
const createDbConnectionString = ({
  db_user_supabase,
  db_pass_supabase,
  db_host,
  db_port,
  db_name,
  db_ssl,
}: {
  db_user_supabase: string
  db_host: string
  db_pass_supabase: string
  db_port: number
  db_name: string
  db_ssl: boolean
}) => {
  return `postgres://${db_user_supabase}:${db_pass_supabase}@${db_host}:${db_port}/${db_name}?sslmode=${
    db_ssl ? 'require' : 'disable'
  }`
}
