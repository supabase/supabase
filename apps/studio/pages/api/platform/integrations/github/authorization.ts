import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    id: '',
    installation_id: '',
    organization_id: '',
    metadata: {
      repositories: [],
      repository_selection: 'all',
    },
    status: 'success',
  })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { code } = req.body

  if (!code) {
    return res.status(400).json({
      error: {
        message: 'Missing required parameter: code',
      },
    })
  }

  return res.status(200).json({
    id: '',
    installation_id: '',
    organization_id: '',
    metadata: {
      repositories: [],
      repository_selection: 'all',
    },
    status: 'success',
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet).post(handlePost))

export default apiHandler
