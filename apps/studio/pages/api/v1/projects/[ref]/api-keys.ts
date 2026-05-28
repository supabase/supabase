import { components } from 'api-types'
import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'

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

const handleGetAll = async (_req: NextApiRequest, res: NextApiResponse) => {
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
    ...(process.env.SUPABASE_PUBLISHABLE_KEY
      ? [
          {
            name: 'publishable',
            api_key: process.env.SUPABASE_PUBLISHABLE_KEY,
            id: 'publishable',
            type: 'publishable',
            hash: '',
            prefix: '',
            description: 'Publishable API key (anon role)',
          },
        ]
      : []),
    ...(process.env.SUPABASE_SECRET_KEY
      ? [
          {
            name: 'secret',
            api_key: process.env.SUPABASE_SECRET_KEY,
            id: 'secret',
            type: 'secret',
            hash: '',
            prefix: '',
            description: 'Secret API key (service_role)',
          },
        ]
      : []),
  ]

  return res.status(200).json(response)
}
