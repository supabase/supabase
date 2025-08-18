import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { DEFAULT_PROJECT, DEFAULT_PROJECT_2, IS_VELA_PLATFORM, PROJECT_REST_URL } from 'pages/api/constants'
import { getVelaClient, mustOrganizationId, mustProjectId } from '../../../../../data/vela/vela'

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
  if (!IS_VELA_PLATFORM) {
    if (req.query.ref === 'default') {
      // Platform specific endpoint
      return res.status(200).json({
        ...DEFAULT_PROJECT,
        connectionString: '',
        restUrl: PROJECT_REST_URL,
      })
    } else if (req.query.ref === 'default2') {
      return res.status(200).json({
        ...DEFAULT_PROJECT_2,
        connectionString: '',
        restUrl: PROJECT_REST_URL,
      })
    }
    return res.status(404).json({
      data: null,
      error: {
        message: 'Project not found',
      },
    })
  }

  const client = getVelaClient()
  const projectId = mustProjectId(req)
  const organizationId = mustOrganizationId(req)

  const response = await client.GET("/organizations/{organization_id}/projects/{project_id}/", {
    params: {
      path: {
        organization_id: organizationId,
        project_id: projectId
      }
    }
  })

  return res.status(200).json(response)
}
