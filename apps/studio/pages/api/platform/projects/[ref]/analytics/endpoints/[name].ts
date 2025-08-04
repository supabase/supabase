import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { PROJECT_ANALYTICS_URL } from 'pages/api/constants'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
    case 'POST':
      const missingEnvVars = [
        process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN ? null : 'LOGFLARE_PRIVATE_ACCESS_TOKEN',
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
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const proxyRequest = async (req: NextApiRequest) => {
  const { name, ref: project, ...toForward } = req.query

  if (req.method === 'GET') {
    const payload = { ...toForward, project }
    return retrieveAnalyticsData(name as string, payload)
  } else if (req.method === 'POST') {
    const payload = { ...req.body, project }
    return retrieveAnalyticsData(name as string, payload)
  }
}

const retrieveAnalyticsData = async (name: string, payload: any) => {
  const search = '?' + new URLSearchParams(payload).toString()
  const apiKey = process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN
  const url = `${PROJECT_ANALYTICS_URL}endpoints/query/${name}${search}`
  const result = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey as string,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  }).then((res) => res.json())

  return result
}
