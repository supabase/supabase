import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'
import { PROJECT_ANALYTICS_URL } from 'pages/api/constants'
import { get } from 'lib/common/fetch'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const { uuid } = req.query

  const missingEnvVars = envVarsSet()

  if (missingEnvVars !== true) {
    return res
      .status(500)
      .json({ error: { message: `${missingEnvVars.join(', ')} env variables are not set` } })
  }

  switch (method) {
    case 'GET':
      // get log drain
      const url = new URL(PROJECT_ANALYTICS_URL)
      url.pathname = `/api/backends/${uuid}`
      const result = await get(url.toString(), {
        headers: {
          'x-api-key': process.env.LOGFLARE_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })

      return res.status(200).json(result)
    case 'PUT':
      // create the log drain
      const putUrl = new URL(PROJECT_ANALYTICS_URL)
      putUrl.pathname = `/api/backends/${uuid}`
      const putResult = await fetch(putUrl, {
        body: JSON.stringify(req.body),
        method: 'PUT',
        headers: {
          'x-api-key': process.env.LOGFLARE_API_KEY as string,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }).then((res) => {
        if (!res || typeof res.body !== 'string') {
          return
        }
        return JSON.parse(res.body)
      })
      return res.status(200).json(putResult)

    case 'DELETE':
      // create the log drain
      const deleteUrl = new URL(PROJECT_ANALYTICS_URL)
      deleteUrl.pathname = `/api/backends/${uuid}`
      await fetch(deleteUrl, {
        headers: {
          'x-api-key': process.env.LOGFLARE_API_KEY as string,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        method: 'DELETE',
      })
      return res.status(204)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const envVarsSet = () => {
  const missingEnvVars = [
    process.env.LOGFLARE_API_KEY ? null : 'LOGFLARE_API_KEY',
    process.env.LOGFLARE_URL ? null : 'LOGFLARE_URL',
  ].filter((v) => v)
  if (missingEnvVars.length == 0) {
    return true
  } else {
    return missingEnvVars
  }
}
