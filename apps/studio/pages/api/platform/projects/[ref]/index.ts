import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { DEFAULT_PROJECT, PROJECT_REST_URL } from 'lib/constants/api'
import { IS_PLATFORM } from 'lib/constants'
import {
  getProjectByRef,
  updateProject,
  deleteProject,
  projectToApiFormat,
} from 'lib/api/self-hosted/projects'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'PATCH':
      return handlePatch(req, res)
    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = req.query

  // For platform, return default project (original behavior)
  if (IS_PLATFORM) {
    const response = {
      ...DEFAULT_PROJECT,
      connectionString: '',
      restUrl: PROJECT_REST_URL,
    }
    return res.status(200).json(response)
  }

  // For self-hosted, fetch the specific project
  try {
    const projectRef = Array.isArray(ref) ? ref[0] : ref

    // Handle 'default' ref for backwards compatibility
    if (projectRef === 'default') {
      const project = await getProjectByRef('default')
      if (project) {
        const response = {
          ...projectToApiFormat(project),
          connectionString: '',
          restUrl: PROJECT_REST_URL,
        }
        return res.status(200).json(response)
      }
      // If 'default' project doesn't exist in DB, return the hardcoded default
      const response = {
        ...DEFAULT_PROJECT,
        connectionString: '',
        restUrl: PROJECT_REST_URL,
      }
      return res.status(200).json(response)
    }

    const project = await getProjectByRef(projectRef || '')
    if (!project) {
      return res.status(404).json({ data: null, error: { message: 'Project not found' } })
    }

    const response = {
      ...projectToApiFormat(project),
      connectionString: '',
      restUrl: PROJECT_REST_URL,
    }
    return res.status(200).json(response)
  } catch (error) {
    console.error('Error fetching project:', error)
    // Fallback to default project on error
    const response = {
      ...DEFAULT_PROJECT,
      connectionString: '',
      restUrl: PROJECT_REST_URL,
    }
    return res.status(200).json(response)
  }
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  // For platform, updating projects is not supported via this endpoint
  if (IS_PLATFORM) {
    return res.status(405).json({ data: null, error: { message: 'Method Not Allowed' } })
  }

  const { ref } = req.query
  const projectRef = Array.isArray(ref) ? ref[0] : ref

  if (!projectRef || projectRef === 'default') {
    return res.status(400).json({ data: null, error: { message: 'Cannot update default project' } })
  }

  try {
    const updates = req.body
    const project = await updateProject(projectRef, updates)

    if (!project) {
      return res.status(404).json({ data: null, error: { message: 'Project not found' } })
    }

    const response = {
      ...projectToApiFormat(project),
      connectionString: '',
      restUrl: PROJECT_REST_URL,
    }
    return res.status(200).json(response)
  } catch (error) {
    console.error('Error updating project:', error)
    return res.status(500).json({ data: null, error: { message: 'Failed to update project' } })
  }
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  // For platform, deleting projects is not supported via this endpoint
  if (IS_PLATFORM) {
    return res.status(405).json({ data: null, error: { message: 'Method Not Allowed' } })
  }

  const { ref } = req.query
  const projectRef = Array.isArray(ref) ? ref[0] : ref

  if (!projectRef || projectRef === 'default') {
    return res.status(400).json({ data: null, error: { message: 'Cannot delete default project' } })
  }

  try {
    const success = await deleteProject(projectRef)

    if (!success) {
      return res.status(404).json({ data: null, error: { message: 'Project not found' } })
    }

    return res.status(200).json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return res.status(500).json({ data: null, error: { message: 'Failed to delete project' } })
  }
}
