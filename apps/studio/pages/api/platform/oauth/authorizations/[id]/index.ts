import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({
      error: { message: 'Authorization ID is required' },
    })
  }

  return res.status(200).json({
    data: {
      id: String(id),
      client_id: '',
      installation_id: '',
      organization_id: '',
      user_id: '',
      created_at: '',
      updated_at: '',
      scopes: [],
      status: 'pending',
      metadata: {
        app_name: '',
        app_icon: '',
        app_website: '',
        redirect_uris: [],
      },
    },
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet)
})

export default apiHandler
