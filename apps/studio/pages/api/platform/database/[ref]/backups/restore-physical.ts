import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handlePost = (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Return a minimal implementation that satisfies the contract
    return res.status(200).json({
      id: '',
      status: 'running',
      error: null,
      inserted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    return res.status(500).json({ error: { message: 'Internal Server Error' } })
  }
}

const apiHandler = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default apiHandler
