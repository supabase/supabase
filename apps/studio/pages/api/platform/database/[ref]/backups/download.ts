import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const fakeResponse = {
      downloadURL: 'https://fake-download-url.com/backup.sql',
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
      status: 'ready',
    }

    return res.status(200).json(fakeResponse)
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}

const apiHandler = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default apiHandler