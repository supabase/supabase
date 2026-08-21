import { NextApiRequest, NextApiResponse } from 'next'

import type { DeploymentModeResponse } from '@/data/config/deployment-mode-query'
import { apiWrapper } from '@/lib/api/apiWrapper'
import { IS_CLI } from '@/lib/constants'

export default function deploymentMode(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler)
}

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

const handleGet = async (_req: NextApiRequest, res: NextApiResponse<DeploymentModeResponse>) => {
  return res.status(200).json({
    is_cli_mode: IS_CLI,
  })
}
