import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  // Return empty array with safe type structure to prevent undefined access
  return res.status(200).json([
    {
      id: '',
      organization_id: '',
      team_id: '',
      created_at: '',
      updated_at: '',
      integration: {
        name: 'GitHub',
      },
      metadata: {
        installation_id: '',
        repository_access: 'all',
        repositories: [],
      },
    },
    {
      id: '',
      organization_id: '',
      team_id: '',
      created_at: '',
      updated_at: '',
      integration: {
        name: 'Vercel',
      },
      metadata: {
        organization_id: '',
        installation_id: '',
        projects: [],
      },
    },
  ])
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
