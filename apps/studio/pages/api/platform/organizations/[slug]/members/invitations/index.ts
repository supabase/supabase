import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getVelaClient } from '../../../../../../../data/vela/vela'
import { getPlatformQueryParams } from '../../../../../../../lib/api/platformQueryParams'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')
  const client = getVelaClient(req)

  const response = await client.get('/organizations/{organization_slug}/members/invitations', {
    params: {
      path: {
        organization_slug: slug,
      },
    },
  })

  if (response.error) {
    return res.status(response.response.status).json(response.error)
  }

  return res.status(200).json({ invitations: response.data })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')
  const client = getVelaClient(req)

  const response = await client.post('/organizations/{organization_slug}/members/invitations', {
    params: {
      path: {
        organization_slug: slug,
      },
    },
    body: req.body,
  })

  if (response.error) {
    return res.status(response.response.status).json(response.error)
  }

  return res.status(200).json(response.data)
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).post(handlePost)
})

export default apiHandler
