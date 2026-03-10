import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { getProvisioner } from 'lib/api/self-hosted/provisioner'
import { toStudioProject } from 'lib/constants/api'

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

const handleGetAll = async (_req: NextApiRequest, res: NextApiResponse) => {
  // CRITICAL: This route is the Docker healthcheck — it MUST always return 200.
  // If the provisioner is unavailable, we fall back to an empty projects array.
  let projects: ReturnType<typeof toStudioProject>[] = []
  try {
    const provisionerProjects = await getProvisioner().listProjects()
    projects = provisionerProjects.map(toStudioProject)
  } catch {
    // Provisioner unavailable — healthcheck must still succeed
    projects = []
  }

  const response = {
    id: 1,
    primary_email: 'johndoe@supabase.io',
    username: 'johndoe',
    first_name: 'John',
    last_name: 'Doe',
    organizations: [
      {
        id: 1,
        name: process.env.DEFAULT_ORGANIZATION_NAME || 'Default Organization',
        slug: 'default-org-slug',
        billing_email: 'billing@supabase.co',
        projects,
      },
    ],
  }
  return res.status(200).json(response)
}
