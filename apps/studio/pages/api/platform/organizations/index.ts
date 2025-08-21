import { NextApiRequest, NextApiResponse } from 'next'
import { DEFAULT_ORGANIZATION, IS_VELA_PLATFORM } from '../../constants'
import { getVelaClient } from '../../../../data/vela/vela'
import { mapOrganization } from '../../../../data/vela/api-mappers'
import { apiBuilder } from '../../../../lib/api/apiBuilder'

const handleCreate = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!IS_VELA_PLATFORM) {
    return res.status(405).send('Not implemented')
  }

  const client = getVelaClient(req)
  const createResponse = await client.post('/organizations/', {
    body: {
      name: req.body.name,
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

  const slug = location.slice(0, -1).split('/').pop()
  console.log(slug)
  const readResponse = await client.get('/organizations/{organization_slug}/', {
    params: {
      path: {
        organization_slug: slug!,
      },
    },
  })

  if (readResponse.response.status !== 200 || !readResponse.data) {
    console.log(readResponse.error)
    return res.status(readResponse.response.status).send(readResponse.error)
  }

  return res.status(200).json(mapOrganization(readResponse.data))
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!IS_VELA_PLATFORM) {
    // Platform specific endpoint
    const response = [DEFAULT_ORGANIZATION]
    return res.status(200).json(response)
  }

  const client = getVelaClient(req)
  const response = await client.get('/organizations/')

  if (response.response.status !== 200 || !response.data) {
    return res.status(response.response.status).send(response.error)
  }

  return res.status(200).json(response.data.map(mapOrganization))
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGetAll).post(handleCreate))

export default apiHandler
