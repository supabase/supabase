import { paths } from 'api-types'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { readAllSnippets, readFolders } from '../_helpers'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'PATCH':
      return handlePatch(req, res)
    default:
      res.setHeader('Allow', ['GET', 'PATCH'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

type GetResponseData =
  paths['/platform/projects/{ref}/content/folders/{id}']['get']['responses']['200']['content']['application/json']

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse<GetResponseData>) => {
  const folders = (await readFolders()).filter((f) => f.parent_id === req.query.id)

  const snippetsData = await readAllSnippets()
  const snippets = snippetsData.filter((s) => s.folder_id === req.query.id)

  return res.status(200).json({ data: { folders: folders, contents: snippets } })
}

type PatchResponseData =
  paths['/platform/projects/{ref}/content/folders/{id}']['patch']['responses']['200']['content']

const handlePatch = async (req: NextApiRequest, res: NextApiResponse<PatchResponseData>) => {
  // Platform specific endpoint
  return res.status(200).json({} as never)
}
