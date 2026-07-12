import { NextApiRequest, NextApiResponse } from 'next'

import { parseDbSchemaString } from '@/data/config/project-postgrest-config-query'
import { apiWrapper } from '@/lib/api/apiWrapper'
import { DEFAULT_EXPOSED_SCHEMAS } from '@/lib/api/self-hosted/constants'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

const SCHEMA_IDENTIFIER_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/
const EXPOSED_SCHEMAS = new Set(parseDbSchemaString(DEFAULT_EXPOSED_SCHEMAS))

function isTimeoutError(error: unknown) {
  return error instanceof DOMException && error.name === 'TimeoutError'
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'HEAD':
      return handleHead(req, res)
    default:
      res.setHeader('Allow', ['GET', 'HEAD'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  if (Array.isArray(req.query.schema)) {
    return res.status(200).json({})
  }

  const rawSchema = typeof req.query.schema === 'string' ? req.query.schema : undefined
  const schema =
    rawSchema && SCHEMA_IDENTIFIER_REGEX.test(rawSchema) && EXPOSED_SCHEMAS.has(rawSchema)
      ? rawSchema
      : undefined

  if (rawSchema && schema === undefined) {
    return res.status(200).json({})
  }

  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
      headers: {
        apikey: process.env.SUPABASE_SERVICE_KEY!,
        ...(schema ? { 'accept-profile': schema } : {}),
      },
    })

    if (response.ok) {
      const data = await response.json()

      return res.status(200).json(data)
    }

    if (response.status === 406) {
      return res.status(200).json({})
    }

    return res.status(500).json({ error: { message: 'Internal Server Error' } })
  } catch (error) {
    if (isTimeoutError(error)) {
      return res.status(504).json({ error: { message: 'Upstream timeout' } })
    }

    return res.status(502).json({ error: { message: 'Bad Gateway' } })
  }
}

const handleHead = async (_req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).end()
}
