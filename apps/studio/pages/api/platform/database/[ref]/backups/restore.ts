import { apiBuilder } from 'lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'

// FIXME: Implementation missing
const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    id: '',
    project_ref: '',
    status: 'not_started',
    started_at: '',
    completed_at: '',
    error: '',
    metadata: {},
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default apiHandler
