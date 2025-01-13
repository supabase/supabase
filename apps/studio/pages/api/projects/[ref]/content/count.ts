import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { extractResponse } from 'pages/api/constants'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

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

type ResponseData = extractResponse<'/platform/projects/{ref}/content/count', 'get'>

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse<ResponseData>) => {
  return res.status(200).json({
    favorites: 0,
    private: 0,
    shared: 0,
  })
}
