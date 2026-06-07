import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { getProjectClient } from '@/lib/console-bff'


// eslint-disable-next-line import/no-anonymous-default-export
export default async (req: NextApiRequest, res: NextApiResponse) => {
  // [console fork] per-project data-plane client
  const _sb = await getProjectClient(req, String(req.query.ref ?? ''))
  if (!_sb) return res.status(503).json({ error: { message: 'Project is not running' } })
  ;(req as any)._sb = _sb
  return apiWrapper(req, res, handler)
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query
  const { data, error } = await ((req as any)._sb).storage.vectors.getBucket(id as string)
  if (error) return res.status(400).json({ error: { message: error.message } })
  return res.status(200).json(data.vectorBucket)
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query
  const { data, error } = await ((req as any)._sb).storage.vectors.deleteBucket(id as string)
  if (error) return res.status(400).json({ error: { message: error.message } })
  return res.status(200).json(data)
}
