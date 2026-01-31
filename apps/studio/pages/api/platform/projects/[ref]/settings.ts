import { NextApiRequest, NextApiResponse } from 'next'

import { components } from 'api-types'
import apiWrapper from 'lib/api/apiWrapper'
import { getProjectSettings } from 'lib/api/self-hosted/settings'
import { IS_PLATFORM } from 'lib/constants'
import { getProjectByRef, getProjectSettingsForProject } from 'lib/api/self-hosted/projects'

type ProjectAppConfig = components['schemas']['ProjectSettingsResponse']['app_config'] & {
  protocol?: string
}
export type ProjectSettings = components['schemas']['ProjectSettingsResponse'] & {
  app_config?: ProjectAppConfig
}

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
  const { ref } = req.query

  // For platform, use original behavior
  if (IS_PLATFORM) {
    const response = getProjectSettings()
    return res.status(200).json(response)
  }

  // For self-hosted, try to get project-specific settings
  try {
    const projectRef = Array.isArray(ref) ? ref[0] : ref

    // Handle 'default' ref or fallback to legacy behavior
    if (projectRef === 'default') {
      const project = await getProjectByRef('default')
      if (project) {
        const response = getProjectSettingsForProject(project)
        return res.status(200).json(response)
      }
      // Fallback to legacy settings
      const response = getProjectSettings()
      return res.status(200).json(response)
    }

    const project = await getProjectByRef(projectRef || '')
    if (!project) {
      // Fallback to legacy settings
      const response = getProjectSettings()
      return res.status(200).json(response)
    }

    const response = getProjectSettingsForProject(project)
    return res.status(200).json(response)
  } catch (error) {
    console.error('Error fetching project settings:', error)
    // Fallback to legacy settings
    const response = getProjectSettings()
    return res.status(200).json(response)
  }
}
