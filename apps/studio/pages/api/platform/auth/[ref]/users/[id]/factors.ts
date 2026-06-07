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
    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query

  // Get all factors for the user
  const { data: factors, error } = await ((req as any)._sb).auth.admin.mfa.listFactors({
    userId: id as string,
  })
  if (error) {
    return res.status(400).json({ error: { message: error.message } })
  }

  factors?.factors.forEach(async (factor: any) => {
    const { error } = await ((req as any)._sb).auth.admin.mfa.deleteFactor({
      id: factor.id,
      userId: id as string,
    })
    if (error) {
      return res.status(400).json({ error: { message: error.message } })
    }
  })

  return res.status(200).json({ data: null, error: null })
}
