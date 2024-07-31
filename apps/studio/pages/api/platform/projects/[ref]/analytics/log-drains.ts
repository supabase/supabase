import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'
import { PROJECT_ANALYTICS_URL } from 'pages/api/constants'
import { get } from 'lib/common/fetch'
import { post } from 'common/fetchWrappers'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  const missingEnvVars = envVarsSet()

  if (missingEnvVars !== true) {
    return res
      .status(500)
      .json({ error: { message: `${missingEnvVars.join(', ')} env variables are not set` } })
  }

  switch (method) {
    case 'GET':
      // list log drains
      const url = new URL(PROJECT_ANALYTICS_URL)
      url.pathname = '/api/backends'
      url.search = new URLSearchParams({
        'metadata[type]': 'log-drain',
      }).toString()
      const result = await get(url.toString(), {
        headers: {
          'x-api-key': process.env.LOGFLARE_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })

      return res.status(200).json(result)
    case 'POST':
      // create the log drain
      const postUrl = new URL(PROJECT_ANALYTICS_URL)
      postUrl.pathname = '/api/backends'
      const postResult = await post(postUrl.toString(), req.body, {
        headers: {
          'x-api-key': process.env.LOGFLARE_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }).then((res) => {
        // TODO: create rules
        return res
      })
      return res.status(201).json(postResult)

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
