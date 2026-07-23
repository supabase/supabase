import { paths } from 'api-types'
import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { getAuthConfigStore } from '@/lib/api/self-hosted/auth-config'
import { UPDATE_GOTRUE_CONFIG_HOOKS_FIELDS } from '@/lib/api/self-hosted/auth-config/fields'
import {
  AuthConfigValidationError,
  type AuthConfigPatch,
} from '@/lib/api/self-hosted/auth-config/fileStore'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

type GoTrueConfigResponse =
  paths['/platform/auth/{ref}/config/hooks']['patch']['responses']['200']['content']['application/json']

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'PATCH':
      return handlePatch(req, res)
    default:
      res.setHeader('Allow', ['PATCH'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const config = await getAuthConfigStore().updateConfig(
      req.body as AuthConfigPatch,
      UPDATE_GOTRUE_CONFIG_HOOKS_FIELDS
    )
    return res.status(200).json(config as unknown as GoTrueConfigResponse)
  } catch (error) {
    if (error instanceof AuthConfigValidationError) {
      return res.status(400).json({ error: { message: error.message } })
    }
    throw error
  }
}
