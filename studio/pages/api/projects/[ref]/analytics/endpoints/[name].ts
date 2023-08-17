import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'
import { PROJECT_ANALYTICS_URL } from 'pages/api/constants'
import { get } from 'lib/common/fetch'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      const missingEnvVars = [
        process.env.LOGFLARE_API_KEY ? null : 'LOGFLARE_API_KEY',
        process.env.LOGFLARE_URL ? null : 'LOGFLARE_URL',
      ].filter((v) => v)
      if (missingEnvVars.length == 0) {
        const result = await proxyRequest(req)
        return res.status(200).json(result)
      } else {
        return res
          .status(500)
          .json({ error: { message: `${missingEnvVars.join(', ')} env variables are not set` } })
      }

    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const proxyRequest = async (req: NextApiRequest) => {
  const { name, ...toForward } = req.query
  const payload = { ...toForward, project_tier: 'ENTERPRISE' }
  const search = '?' + new URLSearchParams(payload as any).toString()
  const apiKey = process.env.LOGFLARE_API_KEY
  const url = `${PROJECT_ANALYTICS_URL}endpoints/query/${name}${search}`
  const result = await get(url, {
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })
  return result
}
