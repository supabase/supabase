import { NextApiRequest, NextApiResponse } from 'next'
import { DEFAULT_ORGANIZATION, IS_VELA_PLATFORM } from '../../../constants'
import { getVelaClient } from '../../../../../data/vela/vela'
import { apiBuilder } from '../../../../../lib/api/apiBuilder'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const slug = req.query.slug as string
  if (!IS_VELA_PLATFORM) {
    switch (slug) {
      case 'default-org-slug':
        return res.status(200).json(DEFAULT_ORGANIZATION)
      default:
        return res
          .status(404)
          .json({ data: null, error: { message: `Organization ${slug} not found` } })
    }
  }

  const organizationId = parseInt(slug)
  const client = getVelaClient(req)
  const createResponse = await client.GET('/organizations/{organization_id}/', {
    params: {
      path: {
        organization_id: organizationId
      }
    },
  })

  if (createResponse.response.status !== 201) {
    return res.status(createResponse.response.status).send(createResponse.error)
  }
}

const handleUpdate = async (req: NextApiRequest, res: NextApiResponse) => {
  const slug = req.query.slug as string
  if (!IS_VELA_PLATFORM) {
    switch (slug) {
      case 'default':
        return res.status(200).json(DEFAULT_ORGANIZATION)
      default:
        return res
          .status(404)
          .json({ data: null, error: { message: `Organization ${slug} not found` } })
    }
  }

  const client = getVelaClient(req)
  const organizationId = parseInt(req.headers['X-Vela-Organization-Id'] as string)

  const createResponse = await client.PUT('/organizations/{organization_id}/', {
    params: {
      path: {
        organization_id: organizationId
      }
    },
    body: {
    },
  })

  if (createResponse.response.status !== 201) {
    return res.status(createResponse.response.status).send(createResponse.error)
  }
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
