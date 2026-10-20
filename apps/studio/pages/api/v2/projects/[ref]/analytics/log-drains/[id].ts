import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { asLogDrainResource, parseLogDrainRequest } from '@/lib/api/self-hosted/log-drains'
import { PROJECT_ANALYTICS_URL } from '@/lib/constants/api'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const { id } = req.query

  const missingEnvVars = envVarsSet()

  if (missingEnvVars !== true) {
    return res
      .status(500)
      .json({ error: { message: `${missingEnvVars.join(', ')} env variables are not set` } })
  }

  const baseUrl = PROJECT_ANALYTICS_URL
  if (!baseUrl) {
    return res.status(500).json({ error: { message: `LOGFLARE_URL env variable is not set` } })
  }

  switch (method) {
    case 'PUT':
      // update the log drain
      const parsedBody = parseLogDrainRequest(req.body)
      if (!parsedBody.success) {
        return res.status(400).json({ error: { message: 'Invalid log drain request body' } })
      }

      const putUrl = new URL(baseUrl)
      putUrl.pathname = `/api/backends/${id}`
      try {
        const putUpstream = await fetch(putUrl, {
          body: JSON.stringify(parsedBody.data),
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })

        if (!putUpstream.ok) {
          return res
            .status(500)
            .json({ error: { message: 'Failed to update log drain in upstream' } })
        }

        const putResult = await putUpstream.json()
        return res.status(200).json({ data: asLogDrainResource(putResult) })
      } catch (err) {
        console.error('error updating log drain', err)
        return res.status(500).json({ error: { message: 'Error updating log drain' } })
      }

    case 'DELETE':
      // delete the log drain
      const deleteUrl = new URL(baseUrl)
      deleteUrl.pathname = `/api/backends/${id}`

      try {
        const deleteUpstream = await fetch(deleteUrl, {
          headers: {
            Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          method: 'DELETE',
        })

        if (!deleteUpstream.ok) {
          return res
            .status(500)
            .json({ error: { message: 'Failed to delete log drain in upstream' } })
        }
      } catch (err) {
        console.error('error deleting log drain', err)
        return res.status(500).json({ error: { message: 'Error deleting log drain' } })
      }
      return res.status(204).end()
    default:
      res.setHeader('Allow', ['PUT', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const envVarsSet = () => {
  const missingEnvVars = [
    process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN ? null : 'LOGFLARE_PRIVATE_ACCESS_TOKEN',
    process.env.LOGFLARE_URL ? null : 'LOGFLARE_URL',
  ].filter((v) => v)
  if (missingEnvVars.length == 0) {
    return true
  } else {
    return missingEnvVars
  }
}
