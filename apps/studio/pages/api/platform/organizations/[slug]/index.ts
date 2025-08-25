import { NextApiRequest, NextApiResponse } from 'next'
import { DEFAULT_ORGANIZATION } from '../../../constants'
import { getVelaClient } from '../../../../../data/vela/vela'
import { apiBuilder } from '../../../../../lib/api/apiBuilder'
import { getPlatformQueryParams } from '../../../../../lib/api/platformQueryParams'
import { mapOrganization } from '../../../../../data/vela/api-mappers'
import { IS_VELA_PLATFORM } from 'lib/constants'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')
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

  const client = getVelaClient(req)
  const response = await client.get('/organizations/{organization_slug}/', {
    params: {
      path: {
        organization_slug: slug,
      },
    },
  })

  if (response.response.status !== 200 || response.data === undefined) {
    return res.status(response.response.status).send(response.error)
  }

  return res.status(200).json(mapOrganization(response.data))
}

const handleUpdate = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')
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
  const createResponse = await client.put('/organizations/{organization_slug}/', {
    params: {
      path: {
        organization_slug: slug,
      },
    },
    body: {},
  })

  if (createResponse.response.status !== 201) {
    return res.status(createResponse.response.status).send(createResponse.error)
  }
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
