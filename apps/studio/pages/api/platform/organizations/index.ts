import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { IS_VELA_PLATFORM } from '../../constants'
import { getVelaClient } from '../../../../data/vela/vela'
import { mapOrganization } from '../../../../data/vela/api-mappers'

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
    return res.status(405).send("Not implemented")
  }

  const client = getVelaClient()
  const createResponse = await client.POST("/organizations/", {
    body: {
      name: req.body.name
    },
    headers: {
      Authorization: req.headers.authorization
    }
  })

  if (createResponse.response.status !== 201) {
    return res.status(createResponse.response.status).send(createResponse.error)
  }

  const location = createResponse.response.headers.get("location");
  if (!location) {
    return res.status(500).send("No location header")
  }

  const orgId = location.split("/").pop()
  const orgResponse = await client.GET("/organizations/{organization_id}/", {
    params: {
      path: {
        organization_id: parseInt(orgId!)
      }
    },
    headers: {
      Authorization: req.headers.authorization
    }
  })

  if (orgResponse.response.status !== 200 || !orgResponse.data) {
    return res.status(orgResponse.response.status).send(orgResponse.error)
  }

  return res.status(303).json(mapOrganization(orgResponse.data))
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!IS_VELA_PLATFORM) {
    // Platform specific endpoint
    const response = [
      {
        id: 1,
        name: process.env.DEFAULT_ORGANIZATION_NAME || 'Default Organization',
        slug: 'default-org-slug',
        billing_email: 'billing@supabase.co',
        plan: {
          id: 'enterprise',
          name: 'Enterprise',
        },
      },
    ]
    return res.status(200).json(response)
  }

  const client = getVelaClient()
  const response = await client.GET("/organizations/", {
    headers: {
      Authorization: req.headers.authorization
    }
  })

  if (response.response.status !== 200 || !response.data) {
    return res.status(response.response.status).send(response.error)
  }

  return res.status(200).json(response.data.map(mapOrganization));
}
