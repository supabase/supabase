import { NextApiRequest, NextApiResponse } from 'next'

import { fetchPost } from 'data/fetchers'
import { constructHeaders } from 'lib/api/apiHelpers'
import apiWrapper from 'lib/api/apiWrapper'

// Proxies to GoTrue's /auth/v1/resend endpoint
// For sign-up confirmation resend we post: { email, type: 'signup' }
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
  const headers = constructHeaders({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
  })

  const url = `${process.env.SUPABASE_URL}/auth/v1/resend`
  // default to signup resend; allow override via body.type if passed
  const payload = { email: req.body.email, type: req.body.type ?? 'signup' }

  const response = await fetchPost(url, payload, { headers })
  if (response.error) {
    const { code, message } = response.error
    return res.status(code).json({ message })
  } else {
    return res.status(200).json(response)
  }
}

