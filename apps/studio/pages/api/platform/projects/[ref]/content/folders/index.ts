import { paths } from 'api-types'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '../_helpers'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

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
      res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

type GetResponseData =
  paths['/platform/projects/{ref}/content/folders']['get']['responses']['200']['content']['application/json']

type GetRequestData =
  paths['/platform/projects/{ref}/content/folders']['get']['parameters']['query']

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse<GetResponseData>) => {
  const params = req.query as GetRequestData

  const folders = await query(`SELECT * FROM public.folders`, req.headers)

  const snippetsData = await query(
    `SELECT * FROM public.snippets WHERE content->>'folder_id' IS NULL`,
    req.headers
  )
  const snippets = snippetsData.map((d) => d.content)

  res.status(200).json({ data: { folders: folders, contents: snippets } })
}

type PostResponseData =
  paths['/platform/projects/{ref}/content/folders']['post']['responses']['201']['content']['application/json']

type PostRequestData =
  paths['/platform/projects/{ref}/content/folders']['post']['requestBody']['content']['application/json']
const handlePost = async (req: NextApiRequest, res: NextApiResponse<PostResponseData>) => {
  const { name, parent_id } = req.body as PostRequestData

  const results = await query(
    `INSERT INTO public.folders (name, parent_id) VALUES ('${name}', ${parent_id ? `'${parent_id}'` : 'NULL'}) RETURNING *`,
    req.headers
  )

  return res.status(200).json(results[0])
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query
  const result = await query(`DELETE FROM public.folders WHERE id = ${id}`, req.headers)
  console.log(result)

  return res.status(200).json({})
}
