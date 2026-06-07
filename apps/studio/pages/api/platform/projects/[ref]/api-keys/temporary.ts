import { components } from 'api-types'
import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { getProjectDataPlane } from '@/lib/console-bff'

type ProjectAppConfig = components['schemas']['ProjectSettingsResponse']['app_config'] & {
  protocol?: string
}
export type ProjectSettings = components['schemas']['ProjectSettingsResponse'] & {
  app_config?: ProjectAppConfig
}

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const dp = await getProjectDataPlane(req, String(req.query.ref ?? ''))
  if (!dp) return res.status(503).json({ error: { message: 'Project is not running' } })
  return res.status(200).json({ api_key: dp.serviceKey })
}
