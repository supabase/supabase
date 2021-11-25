import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'
import { get } from 'lib/common/fetch'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  // Does studio have logs? or is this endpoint platform specific
  const internalApiKey = ''
  const { app } = req.query
  const headers = {
    apikey: internalApiKey,
  }
  const url = `${process.env.SUPABASE_URL}/admin/v1/logs/${app}/tail/10`
  const response = await get(url, headers)
  return res.status(200).json(response)
}
