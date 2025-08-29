import { apiBuilder } from '../../../../../../lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    org_scoped_roles: [
      {
        base_role_id: 0,
        description: 'Test Role',
        id: 0,
        name: 'Test',
        project_ids: [1, 2],
      },
    ],
    project_scoped_roles: []
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
