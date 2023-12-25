import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'PATCH':
      return handlePatch(req, res)
    default:
      res.setHeader('Allow', ['GET', 'PATCH'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const project: any = {
    db_port: 6543,
    pool_mode: null,
    pgbouncer_enabled: false,
    pgbouncer_status: 'COMING_UP',
  }
  return res.status(200).json({ project })
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({})
}
