import { NextApiRequest, NextApiResponse } from 'next'

import { fetchPost } from '@/data/fetchers'
import { constructHeaders } from '@/lib/api/apiHelpers'
import apiWrapper from '@/lib/api/apiWrapper'
import { getProjectDataPlane } from '@/lib/console-bff'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const dp = await getProjectDataPlane(req, String(req.query.ref ?? ''))
  if (!dp) return res.status(503).json({ message: 'Project is not running' })
  const headers = constructHeaders({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${dp.serviceKey}`,
  })
  const url = `${dp.baseUrl}/auth/v1/magiclink`
  const payload = { email: req.body.email }

  const response = await fetchPost(url, payload, { headers })
  if (response.error) {
    const { code, message } = response.error
    return res.status(code).json({ message })
  } else {
    return res.status(200).json(response)
  }
}
