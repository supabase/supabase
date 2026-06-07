import { NextApiRequest, NextApiResponse } from 'next'

import { getProjectClient } from '@/lib/console-bff'

// [console fork] Per-project GoTrue admin users (list + create) via the project's
// running data plane (kong + service role key). Replaces the upstream single-project
// global client.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ref = String(req.query.ref ?? '')
  const supabase = await getProjectClient(req, ref)
  if (!supabase) {
    return res.status(503).json({ error: { message: 'Project is not running' } })
  }

  if (req.method === 'GET') {
    const page = Number(req.query.page ?? 1)
    const perPage = Number(req.query.per_page ?? req.query.perPage ?? 50)
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) return res.status(400).json({ error: { message: error.message } })
    const users = data?.users ?? []
    const verified = users.filter((u: any) => !!u.email_confirmed_at || !!u.phone_confirmed_at)
    return res.status(200).json({
      users,
      total: (data as any)?.total ?? users.length,
      verified: verified.length,
    })
  }

  if (req.method === 'POST') {
    const { data, error } = await supabase.auth.admin.createUser(req.body)
    if (error) return res.status(400).json({ error: { message: error.message } })
    return res.status(200).json(data.user)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } })
}
