import { paths } from 'api-types'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import type { UserContent } from 'types'
import { apiBuilder } from '../../../../../../lib/api/apiBuilder'

type GetResponseData =
  paths['/platform/projects/{ref}/content']['get']['responses']['200']['content']['application/json']

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse<GetResponseData>) => {
  // Platform specific endpoint
  const { favorite, visibility } = req.query
  if (favorite || visibility === 'project') {
    return res.status(200).json({ data: [] })
  }

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
        sql: `select *
              from (select version()) as version,
                   (select current_setting('server_version_num')) as version_number;`,
        schema_version: '1',
        favorite: false,
      } as any,
      favorite: false,
      inserted_at: '',
      project_id: 0,
      updated_at: '',
      owner: {
        id: 1,
        username: 'default',
      },
      updated_by: {
        id: 1,
        username: 'default',
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

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  // Platform specific endpoint
  const snippet: UserContent = req.body
  return res.status(200).json({ data: snippet })
}

const handleDelete = (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({})
}

const apiHandler = apiBuilder((builder) =>
  builder
    .useAuth()
    .get(handleGetAll)
    .post(handlePost)
    .patch(handlePatch)
    .put(handlePut)
    .delete(handleDelete)
)

export default apiHandler
