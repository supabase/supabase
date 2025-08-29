import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    enforced: false,
  })
}

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!req.body?.enforced) {
    return res.status(400).json({
      error: { message: 'enforced field is required' },
    })
  }

  return res.status(200).json({
    enforced: req.body.enforced,
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).put(handlePut)
})

export default apiHandler
