import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json([
    {
      id: '',
      name: '',
      token_hash: '',
      token_last_chars: '',
      created_at: '',
      created_by: '',
      expires_at: null,
    },
  ])
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name } = req.body

  if (!name) {
    return res.status(400).json({
      error: { message: 'Name is required' },
    })
  }

  return res.status(200).json({
    id: '',
    name,
    token: '',
    token_hash: '',
    token_last_chars: '',
    created_at: new Date().toISOString(),
    created_by: '',
    expires_at: null,
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).post(handlePost)
})

export default apiHandler
