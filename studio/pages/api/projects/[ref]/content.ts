import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'
import { UserContent } from 'types'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'POST':
      return handlePost(req, res)
    case 'PATCH':
      return handlePatch(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PATCH'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  // Platform specific endpoint
  const snippets: UserContent[] = [
    {
      id: '1',
      owner_id: 1,
      name: 'SQL Query',
      description: '',
      type: 'sql',
      visibility: 'user',
      content: {
        content_id: '1.0',
        sql: `select * from
  (select version()) as version,
  (select current_setting('server_version_num')) as version_number;`,
        schema_version: '1',
        favorite: false,
      },
    },
  ]
  return res.status(200).json({ data: snippets })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  // Platform specific endpoint
  return res.status(200).json({})
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  // Platform specific endpoint
  return res.status(200).json({})
}
