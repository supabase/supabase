import { NextApiRequest, NextApiResponse } from 'next'
import SqlString from 'sqlstring'

import { post } from 'lib/common/fetch'
import { tryParseInt } from 'lib/helpers'
import { PG_META_URL } from 'lib/constants'
import apiWrapper from 'lib/api/apiWrapper'
import { constructHeaders } from 'lib/api/apiHelpers'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['GET', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  const { keywords, limit, offset, verified } = req.query
  const limitInt = tryParseInt(limit as string) || 10
  const offsetInt = tryParseInt(offset as string) || 0
  const hasValidKeywords = keywords && keywords != ''
  const hasVerifiedValue = verified && verified != ''

  let queryCount = ''
  let queryUsers = ''

  if (hasValidKeywords && !hasVerifiedValue) {
    queryCount = SqlString.format(
      'SELECT count(*) from auth.users WHERE (email ilike ? OR id::text ilike ?);',
      [`%${keywords}%`, `%${keywords}%`]
    )
    queryUsers = SqlString.format(
      'SELECT * from auth.users WHERE (email ilike ? OR id::text ilike ?) ORDER BY created_at DESC LIMIT ? OFFSET ?;',
      [`%${keywords}%`, `%${keywords}%`, limitInt, offsetInt]
    )
  }

  if (!hasValidKeywords && hasVerifiedValue) {
    if (verified === 'verified') {
      queryCount = SqlString.format(
        'SELECT count(*) from auth.users WHERE (email_confirmed_at IS NOT NULL or phone_confirmed_at IS NOT NULL);'
      )
      queryUsers = SqlString.format(
        'SELECT * from auth.users WHERE (email_confirmed_at IS NOT NULL or phone_confirmed_at IS NOT NULL) ORDER BY created_at DESC LIMIT ? OFFSET ?;',
        [limitInt, offsetInt]
      )
    }
    if (verified === 'unverified') {
      queryCount = SqlString.format(
        'SELECT count(*) from auth.users WHERE (email_confirmed_at IS NULL AND phone_confirmed_at IS NULL);'
      )
      queryUsers = SqlString.format(
        'SELECT * from auth.users WHERE (email_confirmed_at IS NULL AND phone_confirmed_at IS NULL) ORDER BY created_at DESC LIMIT ? OFFSET ?;',
        [limitInt, offsetInt]
      )
    }
  }

  if (hasValidKeywords && hasVerifiedValue) {
    if (verified === 'verified') {
      queryCount = SqlString.format(
        'SELECT count(*)  from auth.users WHERE (email_confirmed_at IS NOT NULL or phone_confirmed_at IS NOT NULL) AND (email ilike ? OR id::text ilike ?);',
        [`%${keywords}%`, `%${keywords}%`]
      )
      queryUsers = SqlString.format(
        'SELECT * from auth.users WHERE (email_confirmed_at IS NOT NULL or phone_confirmed_at IS NOT NULL) AND (email ilike ? OR id::text ilike ?) ORDER BY created_at DESC LIMIT ? OFFSET ?;',
        [`%${keywords}%`, `%${keywords}%`, limitInt, offsetInt]
      )
    }
    if (verified === 'unverified') {
      queryCount = SqlString.format(
        'SELECT count(*)  from auth.users WHERE (email_confirmed_at IS NULL AND phone_confirmed_at IS NULL) AND (email ilike ? OR id::text ilike ?);',
        [`%${keywords}%`, `%${keywords}%`]
      )
      queryUsers = SqlString.format(
        'SELECT * from auth.users WHERE (email_confirmed_at IS NULL AND phone_confirmed_at IS NULL) AND (email ilike ? OR id::text ilike ?) ORDER BY created_at DESC LIMIT ? OFFSET ?;',
        [`%${keywords}%`, `%${keywords}%`, limitInt, offsetInt]
      )
    }
  }

  if (!hasValidKeywords && !hasVerifiedValue) {
    queryCount = 'SELECT count(*) from auth.users;'
    queryUsers = SqlString.format(
      'SELECT * from auth.users ORDER BY created_at DESC LIMIT ? OFFSET ?;',
      [limitInt, offsetInt]
    )
  }

  const [getTotal, getUsers] = await Promise.all([
    post(`${PG_META_URL}/query`, { query: queryCount }, { headers }),
    post(`${PG_META_URL}/query`, { query: queryUsers }, { headers }),
  ])

  let total = 0
  if (getTotal && (getTotal as any[]).length > 0) {
    total = (getTotal[0] as any).count
  }

  return res.status(200).json({ total, users: getUsers })
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)

  const payload = req.body
  const query = { query: `DELETE from auth.users where id='${payload.id}';` }

  const response = await post(`${PG_META_URL}/query`, query, { headers })

  if (response.error) {
    console.error('Delete Users POST:', response.error)
    return res.status(400).json({ error: response.error })
  }

  return res.status(200).json(response)
}
