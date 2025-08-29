import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Missing implementation
const handleDelete = (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({})
}

const apiHandler = apiBuilder((builder) => builder.useAuth().delete(handleDelete))

export default apiHandler
