import { apiBuilder } from 'lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'

// FIXME: Implementation missing
const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    id: '',
    name: '',
    status: '',
    created_at: '',
    updated_at: '',
    size: 0,
    metadata: {},
  })
}

const pitr = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default pitr
