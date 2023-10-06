import { NextApiRequest, NextApiResponse } from 'next'
import { PG_META_URL } from 'lib/constants'
import apiWrapper from 'lib/api/apiWrapper'
import { constructHeaders } from 'lib/api/apiHelpers'
import { delete_, get, patch, post } from 'lib/common/fetch'

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      if (req.query.id) return handleGetOne(req, res)
      return handleGetAll(req, res)
    case 'POST':
      return handlePost(req, res)
    case 'PATCH':
      return handlePatch(req, res)
    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE'])
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)

  const queryParams = new URLSearchParams()
  const includedSchemas = req.query['included_schemas']

  if (includedSchemas) {
    const schemas = typeof includedSchemas == 'string' ? includedSchemas : includedSchemas.join(',')
    queryParams.set('included_schemas', schemas)
  }

  const queryStr = queryParams.toString()
  const response = await get(`${PG_META_URL}/tables${queryStr ? `?${queryStr}` : ''}`, { headers })
  if (response.error) {
    return res.status(400).json({ error: response.error })
  }

  let tables = response || []

  return res.status(200).json(tables)
}

const handleGetOne = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  let response = await get(`${PG_META_URL}/tables/${req.query.id}`, {
    headers,
  })
  if (response.error) {
    return res.status(400).json({ error: response.error })
  }
  return res.status(200).json(response)
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  const payload = req.body
  const response = await post(`${PG_META_URL}/tables`, payload, {
    headers,
  })
  if (response.error) {
    console.error('Table POST:', response.error)
    return res.status(400).json({ error: response.error })
  }

  return res.status(200).json(response)
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  const payload = req.body
  const response = await patch(`${PG_META_URL}/tables/${req.query.id}`, payload, {
    headers,
  })
  if (response.error) {
    console.error('Table PATCH:', response.error)
    return res.status(400).json({ error: response.error })
  }

  return res.status(200).json(response)
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  const response = await delete_(`${PG_META_URL}/tables/${req.query.id}`, {}, { headers })
  if (response.error) {
    console.error('Table DELETE:', response.error)
    return res.status(400).json({ error: response.error })
  }

  return res.status(200).json(response)
}
