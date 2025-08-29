import { NextApiRequest, NextApiResponse } from 'next'
import { DEFAULT_PROJECT, DEFAULT_PROJECT_2 } from '../../../../constants'
import { getVelaClient } from '../../../../../../data/vela/vela'
import { mapProject } from '../../../../../../data/vela/api-mappers'
import { ProjectCreateVariables } from '../../../../../../data/projects/project-create-mutation'
import { apiBuilder } from '../../../../../../lib/api/apiBuilder'
import { getPlatformQueryParams } from '../../../../../../lib/api/platformQueryParams'
import { IS_VELA_PLATFORM } from 'lib/constants'

const handleCreate = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log(JSON.stringify(req.body))

  if (!IS_VELA_PLATFORM) {
    return res.status(405).send('Not implemented')
  }

  const client = getVelaClient(req)
  const { slug } = getPlatformQueryParams(req, 'slug')
  const creationRequest = req.body as ProjectCreateVariables

  const createResponse = await client.post('/organizations/{organization_slug}/projects/', {
    params: {
      path: {
        organization_slug: slug,
      },
    },
    body: { // FIXME: get correct values from the UI (after implemented in new/[slug].tsx
      name: creationRequest.name,
      deployment: {
        database: '',
        database_user: '',
        database_password: '',
        database_size: 107374182400,
        vcpu: 32,
        memory: 68719476736,
        iops: 1_000_000,
        database_image_tag: '15.1.0.147',
      },
    },
  })

  if (createResponse.response.status !== 201) {
    return res
      .status(createResponse.response.status)
      .setHeader('Content-Type', createResponse.error?.detail ? 'application/json' : 'text/plain')
      .send(createResponse.error?.detail || createResponse.error)
  }

  const location = createResponse.response.headers.get('location')
  if (!location) {
    return res.status(500).send('No location header')
  }

  const projectRef = location.slice(0, -1).split('/').pop()
  const readResponse = await client.get(
    '/organizations/{organization_slug}/projects/{project_slug}/',
    {
      params: {
        path: {
          organization_slug: slug,
          project_slug: projectRef!,
        },
      },
    }
  )

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

  const { slug } = getPlatformQueryParams(req, 'slug')
  const client = getVelaClient(req)

  const response = await client.get('/organizations/{organization_slug}/projects/', {
    params: {
      path: {
        organization_slug: slug,
      },
    },
  })

  if (response.response.status !== 200 || !response.data) {
    return res.status(response.response.status).send(response.error)
  }

  console.log(JSON.stringify(response.data))
  return res.status(200).json(response.data.map(mapProject))
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGetAll).post(handleCreate))

export default apiHandler
