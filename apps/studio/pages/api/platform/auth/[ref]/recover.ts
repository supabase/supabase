import { NextApiRequest, NextApiResponse } from 'next'
import SqlString from 'sqlstring'

import apiWrapper from 'lib/api/apiWrapper'
import { constructHeaders } from 'lib/api/apiHelpers'
import { post } from 'lib/common/fetch'
import { tryParseInt } from 'lib/helpers'

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
  const url = `${process.env.SUPABASE_URL}/auth/v1/recover`
  const payload = { email: req.body.email }
  const response = await post(url, payload, { headers })
  return res.status(200).json(response)
}
