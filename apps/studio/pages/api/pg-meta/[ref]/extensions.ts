import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { PG_META_URL } from 'lib/constants'
import { get, post, delete_ } from 'lib/common/fetch'
import { constructHeaders, toSnakeCase } from 'lib/api/apiHelpers'

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'POST':
      return handlePost(req, res)
    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  let response = await get(`${PG_META_URL}/extensions`, {
    headers,
  })
  if (response.error) {
    return res.status(400).json(response.error)
  }
  return res.status(200).json(response)
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  const payload = toSnakeCase(req.body)
  const response = await post(`${PG_META_URL}/extensions`, payload, {
    headers,
  })

  if (response.error) {
    console.error('Extensions POST:', response.error)
    return res.status(400).json(response.error)
  }

  return res.status(200).json(response)
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  const response = await delete_(`${PG_META_URL}/extensions/${req.query.id}`, {}, { headers })

  if (response.error) {
    console.error('Extensions DELETE:', response.error)
    return res.status(400).json(response.error)
  }

  return res.status(200).json(response)
}
