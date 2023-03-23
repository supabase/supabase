import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'
import { PROJECT_ANALYTICS_URL } from 'pages/api/constants'
import { get } from 'lib/common/fetch'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      console.log(req)
      const result = await proxyRequest(req)
      return res.status(200).json(result)
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
  console.log('api key', apiKey)
  console.log('PROJECT_ANALYTICS_URL', PROJECT_ANALYTICS_URL)
  const url = `${PROJECT_ANALYTICS_URL}api/endpoints/query/name/${name}${search}`
  console.log('url', url)
  const result = await get(url, {
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })
  console.log('result', result)
  return result
}
