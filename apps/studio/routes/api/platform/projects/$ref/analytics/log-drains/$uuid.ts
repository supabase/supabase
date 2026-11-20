import { createFileRoute } from '@tanstack/react-router'
import { NextApiRequest, NextApiResponse } from 'next'

import { toWebHandler } from '@/compat/next/api'
import { apiWrapper } from '@/lib/api/apiWrapper'
import { PROJECT_ANALYTICS_URL } from '@/lib/constants/api'

const nextHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const { uuid } = req.query

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
    case 'GET':
      // get log drain
      const url = new URL(baseUrl)
      url.pathname = `/api/backends/${uuid}`
      const result = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }).then((r) => r.json())

      return res.status(200).json(result)
    case 'PUT':
      // update the log drain
      const putUrl = new URL(baseUrl)
      putUrl.pathname = `/api/backends/${uuid}`
      delete req.body['metadata']
      try {
        const putResponse = await fetch(putUrl, {
          body: JSON.stringify(req.body),
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })
        if (!putResponse.ok) {
          console.error('error updating log drain', putResponse.status)
          return res.status(500).json({ error: { message: 'Error updating log drain' } })
        }
        const putResult = await putResponse.json()
        return res.status(200).json(putResult)
      } catch (err) {
        console.error('error updating log drain', err)
        return res.status(500).json({ error: { message: 'Error updating log drain' } })
      }

    case 'DELETE':
      // delete the log drain
      const deleteUrl = new URL(baseUrl)
      deleteUrl.pathname = `/api/backends/${uuid}`

      try {
        const deleteResponse = await fetch(deleteUrl, {
          headers: {
            Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          method: 'DELETE',
        })
        if (!deleteResponse.ok) {
          console.error('error deleting log drain', deleteResponse.status)
          return res.status(500).json({ error: { message: 'Error deleting log drain' } })
        }
        return res.status(204).end()
      } catch (err) {
        console.error('error deleting log drain', err)
        return res.status(500).json({ error: { message: 'Error deleting log drain' } })
      }
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
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

const webHandler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/projects/$ref/analytics/log-drains/$uuid')({
  // ANY routes unsupported methods to the handler so they get a 405 with an Allow header
  server: { handlers: { GET: webHandler, PUT: webHandler, DELETE: webHandler, ANY: webHandler } },
})
