import { NextApiRequest, NextApiResponse } from 'next'

import { fetchGet } from 'data/fetchers'
import { constructHeaders } from 'lib/api/apiHelpers'
import apiWrapper from 'lib/api/apiWrapper'
import { IS_PLATFORM, PG_META_URL } from 'lib/constants'

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } })
  }
}

/**
 * Construct the pgMeta redirection url passing along the filtering query params.
 * In self-hosted mode, overrides included_schemas with the project's co_{ref} schema
 * so the Table Editor only shows tables belonging to the selected project.
 */
export function getPgMetaRedirectUrl(req: NextApiRequest, endpoint: string) {
  const ref = req.query.ref as string
  const query = new URLSearchParams()

  // Copy query params, excluding the dynamic route param 'ref'
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'ref') continue
    // In self-hosted mode, skip any incoming included_schemas — we override it below
    if (!IS_PLATFORM && key === 'included_schemas') continue

    if (Array.isArray(value)) {
      for (const v of value) {
        query.append(key, v)
      }
    } else if (value) {
      query.set(key, value)
    }
  }

  // Self-hosted schema isolation: override included_schemas so pg-meta only returns
  // objects from the project's co_{ref} schema (locked CONTEXT.md decision).
  if (!IS_PLATFORM && ref) {
    query.set('included_schemas', `co_${ref}`)
  }

  const qs = query.toString()
  return `${PG_META_URL}/${endpoint}${qs ? `?${qs}` : ''}`
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  const response = await fetchGet(getPgMetaRedirectUrl(req, 'tables'), { headers })

  if (response.error) {
    const { code, message } = response.error
    return res.status(code).json({ message })
  } else {
    return res.status(200).json(response)
  }
}
