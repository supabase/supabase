import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  // Return empty response object to prevent undefined access
  return res.status(200).json({
    hooks: [],
    config: {},
    settings: {},
    status: 'success',
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default apiHandler
