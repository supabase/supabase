import { components } from 'api-types'
import { NextApiRequest, NextApiResponse } from 'next'

import { consoleFetch, consoleGet } from '@/lib/console-bff'

// [console fork] PostgREST config is how studio toggles the Data API: `db_schema`
// containing `public` == enabled. We derive it from the project's stored
// dataApiEnabled flag (GET) and flip that flag (PATCH), re-applying the stack.
const ENABLED_SCHEMAS = 'public,storage,graphql_public'
const DISABLED_SCHEMAS = 'storage,graphql_public'

function configFor(dataApiEnabled: boolean): components['schemas']['GetPostgrestConfigResponse'] {
  return {
    db_anon_role: 'anon',
    db_extra_search_path: 'public,extensions',
    db_schema: dataApiEnabled ? ENABLED_SCHEMAS : DISABLED_SCHEMAS,
    jwt_secret: 'super-secret-jwt-token-with-at-least-32-characters-long',
    max_rows: 1000,
    role_claim_key: '.role',
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ref = String(req.query.ref ?? '')

  if (req.method === 'GET') {
    const { data: project } = await consoleGet<any>(req, `/api/v1/projects/${ref}`)
    return res.status(200).json(configFor(project?.dataApiEnabled ?? true))
  }

  if (req.method === 'PATCH') {
    const body = req.body ?? {}
    // studio sends the new db_schema; presence of `public` means Data API enabled.
    const enabled =
      typeof body.db_schema === 'string'
        ? body.db_schema.split(',').some((s: string) => s.trim() === 'public')
        : body.dataApiEnabled ?? true
    const { ok, status, data } = await consoleFetch<any>(req, `/api/v1/projects/${ref}/data-api`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.message ?? 'Failed to update Data API' } })
    }
    return res.status(200).json(configFor((data as any)?.dataApiEnabled ?? enabled))
  }

  res.setHeader('Allow', ['GET', 'PATCH'])
  return res.status(405).json({ data: null, error: { message: `Method ${req.method} Not Allowed` } })
}
