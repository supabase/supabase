import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { get, post, delete_, patch } from 'lib/common/fetch'
import { constructHeaders } from 'lib/api/apiHelpers'
import { PG_META_URL } from 'lib/constants'

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'POST':
      return handlePost(req, res)  
    case 'PATCH':
      return handlePatch(req, res)  
    case 'DELETE':
      return handleDelete(req, res)  
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  let response = await get(`${PG_META_URL}/roles`, {
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
  let response = await post(`${PG_META_URL}/roles`, payload, {
    headers,
  })
  if (response.error) {
    return res.status(400).json({ error: response.error })
  }
  return res.status(200).json(response)
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  const roleId = req.query.id
  let response = await patch(`${PG_META_URL}/roles/${roleId}`, req.body, {headers})
  if (response.error) {
    return res.status(400).json({ error: response.error })
  }
  return res.status(200).json(response)
}
const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)
  const roleId = req.query.id
  let response = await delete_(`${PG_META_URL}/roles/${roleId}`, {headers})
  if (response.error) {
    return res.status(400).json({ error: response.error })
  }
  return res.status(200).json(response)
}
