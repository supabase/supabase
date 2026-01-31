import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { DEFAULT_PROJECT } from 'lib/constants/api'
import { IS_PLATFORM } from 'lib/constants'
import {
  getProjects,
  createProject,
  projectToApiFormat,
} from 'lib/api/self-hosted/projects'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'POST':
      return handleCreate(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  // For platform, return default project (original behavior)
  if (IS_PLATFORM) {
    const response = [DEFAULT_PROJECT]
    return res.status(200).json(response)
  }

  // For self-hosted, fetch projects from database
  try {
    const projects = await getProjects()

    // If no projects exist, return the default project for backwards compatibility
    if (projects.length === 0) {
      return res.status(200).json([DEFAULT_PROJECT])
    }

    const response = projects.map(projectToApiFormat)
    return res.status(200).json(response)
  } catch (error) {
    console.error('Error fetching projects:', error)
    // Fallback to default project on error
    return res.status(200).json([DEFAULT_PROJECT])
  }
}

const handleCreate = async (req: NextApiRequest, res: NextApiResponse) => {
  // For platform, creating projects is not supported via this endpoint
  if (IS_PLATFORM) {
    return res.status(405).json({ data: null, error: { message: 'Method Not Allowed' } })
  }

  // For self-hosted, create a new project
  try {
    const { name, organization_id, db_name, region } = req.body

    if (!name) {
      return res.status(400).json({ data: null, error: { message: 'Project name is required' } })
    }

    const orgId = organization_id || 1 // Default to organization 1

    const project = await createProject({
      name,
      organization_id: orgId,
      db_name,
      region,
    })

    if (!project) {
      return res.status(500).json({ data: null, error: { message: 'Failed to create project' } })
    }

    const response = projectToApiFormat(project)
    return res.status(201).json(response)
  } catch (error) {
    console.error('Error creating project:', error)
    return res.status(500).json({ data: null, error: { message: 'Failed to create project' } })
  }
}
