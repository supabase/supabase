import { paths } from 'api-types'
import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { getAuthConfigStore } from '@/lib/api/self-hosted/auth-config'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

type GoTrueConfigResponse =
  paths['/platform/auth/{ref}/templates/{template}/reset']['post']['responses']['200']['content']['application/json']

type TemplateParam =
  paths['/platform/auth/{ref}/templates/{template}/reset']['post']['parameters']['path']['template']

/** Maps the API template param to the GoTrue env var suffix. */
const TEMPLATE_SUFFIXES: Record<TemplateParam, string> = {
  confirmation: 'CONFIRMATION',
  'email-change': 'EMAIL_CHANGE',
  invite: 'INVITE',
  'magic-link': 'MAGIC_LINK',
  recovery: 'RECOVERY',
  reauthentication: 'REAUTHENTICATION',
  'password-changed-notification': 'PASSWORD_CHANGED_NOTIFICATION',
  'email-changed-notification': 'EMAIL_CHANGED_NOTIFICATION',
  'phone-changed-notification': 'PHONE_CHANGED_NOTIFICATION',
  'mfa-factor-enrolled-notification': 'MFA_FACTOR_ENROLLED_NOTIFICATION',
  'mfa-factor-unenrolled-notification': 'MFA_FACTOR_UNENROLLED_NOTIFICATION',
  'identity-linked-notification': 'IDENTITY_LINKED_NOTIFICATION',
  'identity-unlinked-notification': 'IDENTITY_UNLINKED_NOTIFICATION',
}

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
  const { template } = req.query
  const suffix = TEMPLATE_SUFFIXES[template as TemplateParam]

  if (!suffix) {
    return res.status(400).json({ error: { message: `Unknown template: ${template}` } })
  }

  const config = await getAuthConfigStore().resetTemplate(suffix)
  return res.status(200).json(config as unknown as GoTrueConfigResponse)
}
