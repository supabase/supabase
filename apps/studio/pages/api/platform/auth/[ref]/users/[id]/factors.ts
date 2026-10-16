import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

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
  const { data: factors, error } = await supabase.auth.admin.mfa.listFactors({
    userId: id as string,
  })
  if (error) {
    return res.status(400).json({ error: { message: error.message } })
  }

  // Await every deletion before responding. Without this the handler reports success
  // while the deletions are still in flight, so a failure is never surfaced and the user
  // can be left with factors still enrolled.
  const deletionErrors = await Promise.all(
    (factors?.factors ?? []).map(async (factor) => {
      const { error } = await supabase.auth.admin.mfa.deleteFactor({
        id: factor.id,
        userId: id as string,
      })
      return error
    })
  )

  const failedDeletion = deletionErrors.find((deletionError) => !!deletionError)
  if (failedDeletion) {
    return res.status(400).json({ error: { message: failedDeletion.message } })
  }

  return res.status(200).json({ data: null, error: null })
}
