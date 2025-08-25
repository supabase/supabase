import { NextApiRequest, NextApiResponse } from 'next'
import {
  DEFAULT_PROJECT,
  DEFAULT_PROJECT_2,
  PROJECT_REST_URL,
} from 'pages/api/constants'
import { getVelaClient } from '../../../../../../../data/vela/vela'
import { apiBuilder } from '../../../../../../../lib/api/apiBuilder'
import { getPlatformQueryParams } from '../../../../../../../lib/api/platformQueryParams'
import { mapProject } from '../../../../../../../data/vela/api-mappers'
import { IS_VELA_PLATFORM } from 'lib/constants'

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

  const { slug, ref } = getPlatformQueryParams(req, "slug", "ref")
  const client = getVelaClient(req)

  const response = await client.get('/organizations/{organization_slug}/projects/{project_slug}/', {
    params: {
      path: {
        organization_slug: slug,
        project_slug: ref,
      },
    },
  })

  if (response.response.status !== 200 || response.data === undefined) {
    return res.status(response.response.status).send(response.error)
  }

  return res.status(200).json(mapProject(response.data))
}

const apiHandler = apiBuilder((builder) => builder.get(handleGet))

export default apiHandler
