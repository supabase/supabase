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
    case 'POST':
      return handlePost(req, res)

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { data, error } = await ((req as any)._sb).storage.vectors.listBuckets()
    if (error) throw error
    return res.status(200).json(data)
  } catch {
    // [console fork] Vector storage may not be available in the project's stack version.
    return res.status(200).json([])
  }
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { bucketName } = req.body
  const { data, error } = await ((req as any)._sb).storage.vectors.createBucket(bucketName)
  if (error) return res.status(400).json({ error: { message: error.message } })
  return res.status(200).json(data)
}
