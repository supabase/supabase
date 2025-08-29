import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, token } = req.query

  if (!slug || !token) {
    return res.status(400).json({
      error: { message: 'Organization slug and token are required' },
    })
  }

  return res.status(200).json({
    id: '',
    role_id: '',
    invited_by_id: '',
    invited_at: '',
    invited_email: '',
    token: token as string,
    organization: {
      id: '',
      name: '',
      slug: slug as string,
    },
  })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, token } = req.query

  if (!slug || !token) {
    return res.status(400).json({
      error: { message: 'Organization slug and token are required' },
    })
  }

  return res.status(200).json({
    id: '',
    username: '',
    primary_email: '',
    role_ids: [],
    organization: {
      id: '',
      name: '',
      slug: slug as string,
    },
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).post(handlePost)
})

export default apiHandler
