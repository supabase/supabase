import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handlePost = (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Return minimal fake data that won't cause null/undefined errors
    const fakeResponse = {
      success: true,
      isSpam: false,
      status: 'valid',
      details: {
        score: 0,
        reasons: [],
      },
    }

    res.status(200).json(fakeResponse)
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

const apiHandler = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default apiHandler
