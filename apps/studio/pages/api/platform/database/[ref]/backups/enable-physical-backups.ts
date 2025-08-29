import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handlePost = (req: NextApiRequest, res: NextApiResponse) => {
  // Return a minimal safe response
  // The mutation doesn't seem to require any specific response shape
  // based on the caller in enable-physical-backups-mutation.ts
  return res.status(200).json({
    id: '',
    enabled: true,
    success: true,
    error: null,
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default apiHandler
