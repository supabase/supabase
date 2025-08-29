import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  // Basic empty implementation that prevents null/undefined access
  return res.status(200).json({
    status: '',
    progress: 0,
    error: null,
    warnings: [],
    logs: [],
    started_at: '',
    completed_at: null,
  })
}

const apiHandler = apiBuilder((builder) => builder.get(handleGet))

export default apiHandler
