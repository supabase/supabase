import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'
import { DEFAULT_PROJECT } from 'pages/api/constants'

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
  const pgVersion = DEFAULT_PROJECT.serviceVersions['supabase-postgres']
  const response = {
    eligible: true,
    current_app_version: `supabase-postgres-${pgVersion}`,
    target_upgrade_versions: [],
    potential_breaking_changes: [],
    duration_estimate_hours: 1,
    legacy_auth_custom_roles: [],
    extension_dependent_objects: [],
  }

  return res.status(200).json(response)
}
