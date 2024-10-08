import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'
import type { UserContent } from 'types'
import { extractResponse } from 'pages/api/constants'

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

type GetResponseData = extractResponse<'/platform/projects/{ref}/content/folders/{id}', 'get'>

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse<GetResponseData>) => {
  return res.status(200).json({ data: { folders: [] } })
}

type PatchResponseData = extractResponse<'/platform/projects/{ref}/content/folders/{id}', 'patch'>

const handlePatch = async (req: NextApiRequest, res: NextApiResponse<PatchResponseData>) => {
  // Platform specific endpoint
  return res.status(200).json({} as never)
}
