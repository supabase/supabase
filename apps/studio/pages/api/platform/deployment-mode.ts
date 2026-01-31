import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

export default function deploymentMode(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler)
}

type ResponseData = {
  is_cli_mode: boolean
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse<ResponseData>) => {
  // CURRENT_CLI_VERSION is set by the Supabase CLI when starting Studio
  const isCliMode = !!process.env.CURRENT_CLI_VERSION

  return res.status(200).json({
    is_cli_mode: isCliMode,
  })
}
