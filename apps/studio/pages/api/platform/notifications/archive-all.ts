import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.headers['version'] !== '2') {
    return res.status(400).json({
      error: { message: 'Version 2 header required' },
    })
  }

  return res.status(200).json({
    data: {
      archived: true,
      count: 0,
    },
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().patch(handlePatch))

export default apiHandler
