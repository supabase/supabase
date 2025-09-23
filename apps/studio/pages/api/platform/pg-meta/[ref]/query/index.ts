import { constructHeaders } from 'lib/api/apiHelpers'
import apiWrapper from 'lib/api/apiWrapper'
import { executeQuery } from 'lib/api/self-hosted/query'
import { NextApiRequest, NextApiResponse } from 'next'

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } })
  }
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { query } = req.body
  const headers = constructHeaders(req.headers)
  const { data, error } = await executeQuery({ query, headers })

  if (error) {
    const { code, message } = error
    return res.status(code ?? 500).json({ message, formattedError: message })
  } else {
    return res.status(200).json(data)
  }
}
