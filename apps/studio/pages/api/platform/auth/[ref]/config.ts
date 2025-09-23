import { NextApiRequest, NextApiResponse } from 'next'

import { fetchGet } from 'data/fetchers'
import { constructHeaders } from 'lib/api/apiHelpers'
import apiWrapper from 'lib/api/apiWrapper'

// Local proxy to expose minimal GoTrue config for Studio in self-hosted/dev
// Returns an object compatible with the subset Studio uses: MAILER_AUTOCONFIRM, etc.
export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  switch (method) {
    case 'GET':
      return handleGet(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (_req: NextApiRequest, res: NextApiResponse) => {
  // This endpoint does not require auth; it exposes public auth settings
  const headers = constructHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' })
  const url = `${process.env.SUPABASE_URL}/auth/v1/settings`

  const response = await fetchGet(url, { headers })
  if ((response as any).error) {
    const { code, message } = (response as any).error
    return res.status(code).json({ message })
  }

  const settings = response as any
  const data = {
    // Studio expects MAILER_AUTOCONFIRM: true => no confirmation required
    MAILER_AUTOCONFIRM: Boolean(settings.mailer_autoconfirm),
    DISABLE_SIGNUP: Boolean(settings.disable_signup),
    EXTERNAL_ANONYMOUS_USERS_ENABLED: Boolean(settings?.external?.anonymous_users ?? false),
  }

  return res.status(200).json(data)
}

