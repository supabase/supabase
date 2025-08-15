import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { DEFAULT_PROJECT, DEFAULT_PROJECT_2, IS_VELA_PLATFORM } from '../../constants'
import { getVelaClient, mustOrganizationId } from '../../../../data/vela/vela'
import { mapProject } from '../../../../data/vela/api-mappers'
import { ProjectCreateVariables } from '../../../../data/projects/project-create-mutation'

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

const handleCreate = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!IS_VELA_PLATFORM) {
    return res.status(405).send('Not implemented')
  }

  const client = getVelaClient()
  const organizationId = mustOrganizationId(req)

  const creationRequest = req.body as ProjectCreateVariables

  const createResponse = await client.POST('/organizations/{organization_id}/projects/', {
    params: {
      path: {
        organization_id: organizationId,
      },
    },
    body: {
      name: creationRequest.name,
    },
  })

  if (createResponse.response.status !== 201) {
    return res.status(createResponse.response.status).send(createResponse.error)
  }

  const location = createResponse.response.headers.get('location')
  if (!location) {
    return res.status(500).send('No location header')
  }

  const projectId = location.split('/').pop()
  const readResponse = await client.GET('/organizations/{organization_id}/projects/{project_id}/', {
    params: {
      path: {
        organization_id: organizationId,
        project_id: parseInt(projectId!),
      }
    }
  })

  if (readResponse.response.status !== 200 || !readResponse.data) {
    return res.status(readResponse.response.status).send(readResponse.error)
  }
  return res.status(200).json(mapProject(readResponse.data))
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!IS_VELA_PLATFORM) {
    // Platform specific endpoint
    const response = [DEFAULT_PROJECT, DEFAULT_PROJECT_2]
    return res.status(200).json(response)
  }

  const client = getVelaClient()
  const organizationId = mustOrganizationId(req)

  const response = await client.GET('/organizations/{organization_id}/projects/', {
    params: {
      path: {
        organization_id: organizationId,
      },
    },
  })

  if (response.response.status !== 200 || !response.data) {
    return res.status(response.response.status).send(response.error)
  }

  return res.status(200).json(response.data.map(mapProject))
}
