import { NextApiRequest, NextApiResponse } from 'next'

import { components } from 'api-types'
import apiWrapper from 'lib/api/apiWrapper'

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
    case 'GET':
      return handleGetAll(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const response = [
    {
      name: 'anon',
      api_key: process.env.SUPABASE_ANON_KEY ?? '',
      id: 'anon',
      type: 'legacy',
      hash: '',
      prefix: '',
      description: 'Legacy anon API key',
    },
    {
      name: 'service_role',
      api_key: process.env.SUPABASE_SERVICE_KEY ?? '',
      id: 'service_role',
      type: 'legacy',
      hash: '',
      prefix: '',
      description: 'Legacy service_role API key',
    },
  ]

  return res.status(200).json(response)
}
