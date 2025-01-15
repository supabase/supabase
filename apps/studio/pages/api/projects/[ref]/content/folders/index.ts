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
    case 'POST':
      return handlePost(req, res)
    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

type GetResponseData = extractResponse<'/platform/projects/{ref}/content/folders', 'get'>

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse<GetResponseData>) => {
  // Platform specific endpoint
  const snippets = [
    {
      id: '1',
      owner_id: 1,
      name: 'SQL Query',
      description: '',
      type: 'sql' as const,
      visibility: 'user' as const,
      content: {
        content_id: '1.0',
        sql: `select * from
  (select version()) as version,
  (select current_setting('server_version_num')) as version_number;`,
        schema_version: '1',
        favorite: false,
      },
      inserted_at: '',
      updated_at: '',
      project_id: 0,
      favorite: false,
    },
  ]
  return res.status(200).json({
    data: {
      folders: [],
      contents: snippets,
    },
  })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  // Platform specific endpoint
  return res.status(200).json({})
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  // Platform specific endpoint
  return res.status(200).json({})
}
