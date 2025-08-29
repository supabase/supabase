import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getVelaClient } from 'data/vela/vela'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, gotrue_id } = getPlatformQueryParams(req, 'slug', 'gotrue_id')
  const client = getVelaClient(req)

  const response = await client.delete('/organizations/{organization_slug}/members/{gotrue_id}', {
    params: {
      path: {
        organization_slug: slug,
        gotrue_id,
      },
    },
  })

  if (response.error) {
    return res.status(response.response.status).json(response.error)
  }

  return res.status(200).json(response.data)
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, gotrue_id } = getPlatformQueryParams(req, 'slug', 'gotrue_id')
  const client = getVelaClient(req)

  const response = await client.put('/organizations/{organization_slug}/members/{gotrue_id}', {
    params: {
      path: {
        organization_slug: slug,
        gotrue_id,
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
  builder.useAuth().patch(handlePatch).delete(handleDelete)
})

export default apiHandler
