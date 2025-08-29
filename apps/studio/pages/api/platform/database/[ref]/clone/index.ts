import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from '../../../../../../lib/api/apiBuilder'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    status: 'READY',
    data: [],
    error: null,
  })
}

// FIXME: Implementation missing
const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    id: '',
    name: '',
    status: 'PENDING',
    error: null,
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet).post(handlePost))

export default apiHandler
