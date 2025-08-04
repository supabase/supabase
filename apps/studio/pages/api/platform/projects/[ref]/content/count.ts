import { paths } from 'api-types'
import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { getSnippets } from 'lib/api/snippets.utils'

const wrappedHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

type ResponseData =
  paths['/platform/projects/{ref}/content/count']['get']['responses']['200']['content']['application/json']

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse<ResponseData>) => {
  const snippets = await getSnippets()

  return res.status(200).json({
    shared: snippets.filter((s) => s.visibility === 'project').length,
    favorites: snippets.filter((s) => s.content?.favorite).length,
    private: snippets.filter((s) => s.visibility === 'user').length,
  })
}

export default wrappedHandler
