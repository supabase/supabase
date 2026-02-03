import { paths } from 'api-types'
import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { createFolder, deleteFolder, getFolders, getSnippets } from 'lib/api/snippets.utils'

const wrappedHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

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

type GetRequestData =
  paths['/platform/projects/{ref}/content/folders']['get']['parameters']['query']
type GetResponseData =
  paths['/platform/projects/{ref}/content/folders']['get']['responses']['200']['content']['application/json']

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse<GetResponseData>) => {
  const params = req.query as GetRequestData

  const folders = await getFolders()
  const { cursor, snippets } = await getSnippets({
    searchTerm: params?.name,
    limit: params?.limit ? Number(params.limit) : undefined,
    cursor: params?.cursor,
    sort: params?.sort_by,
    sortOrder: params?.sort_order,
  })

  res.status(200).json({ data: { folders, contents: snippets }, cursor })
}

type PostResponseData =
  paths['/platform/projects/{ref}/content/folders']['post']['responses']['201']['content']['application/json']

type PostRequestData =
  paths['/platform/projects/{ref}/content/folders']['post']['requestBody']['content']['application/json']
const handlePost = async (req: NextApiRequest, res: NextApiResponse<PostResponseData>) => {
  const { name } = req.body as PostRequestData

  const folder = await createFolder(name)

  return res.status(201).json(folder)
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ids } = req.query

  if (!ids || typeof ids !== 'string') {
    return res.status(400).json({ error: 'Folder IDs are required' })
  }
  const folderIds = ids.split(',').map((id) => id.trim())

  await Promise.all(folderIds.map((id) => deleteFolder(id)))

  return res.status(200).json({})
}

export default wrappedHandler
