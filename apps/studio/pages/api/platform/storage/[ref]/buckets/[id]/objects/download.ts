import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { getProjectClient } from '@/lib/console-bff'


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
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query
  const { path } = req.body

  const { data, error } = await ((req as any)._sb).storage.from(id as string).download(path)
  if (error) {
    return res.status(400).json({ error: { message: error.message } })
  }

  return res
    .status(200)
    .setHeader('Content-Type', 'application/octet-stream')
    .send(Buffer.from(await data.arrayBuffer()))
}
