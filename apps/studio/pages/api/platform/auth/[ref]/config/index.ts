import { apiBuilder } from 'lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  // FIXME: Implementation missing
  return res.status(200).json({
    id: '',
    disable_signup: false,
    mailer_autoconfirm: false,
    sms_autoconfirm: false,
    sms_provider: '',
    sms_template: '',
    custom_access_token_script: '',
    external: {
      apple: { enabled: false },
      azure: { enabled: false },
      bitbucket: { enabled: false },
      discord: { enabled: false },
      facebook: { enabled: false },
      github: { enabled: false },
      gitlab: { enabled: false },
      google: { enabled: false },
      keycloak: { enabled: false },
      linkedin: { enabled: false },
      notion: { enabled: false },
      slack: { enabled: false },
      spotify: { enabled: false },
      twitch: { enabled: false },
      twitter: { enabled: false },
      workos: { enabled: false }
    },
    smtp: {
      admin_email: '',
      host: '',
      port: 587,
      user: '',
      pass: '',
      max_frequency: 0,
      sender_name: ''
    }
  })
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  // FIXME: Implementation missing
  const config = req.body

  // Return the updated config, merging the input with default values
  return res.status(200).json({
    id: '',
    disable_signup: config.disable_signup ?? false,
    mailer_autoconfirm: config.mailer_autoconfirm ?? false,
    sms_autoconfirm: config.sms_autoconfirm ?? false,
    sms_provider: config.sms_provider ?? '',
    sms_template: config.sms_template ?? '',
    custom_access_token_script: config.custom_access_token_script ?? '',
    external: {
      apple: { enabled: false },
      azure: { enabled: false },
      bitbucket: { enabled: false },
      discord: { enabled: false },
      facebook: { enabled: false },
      github: { enabled: false },
      gitlab: { enabled: false },
      google: { enabled: false },
      keycloak: { enabled: false },
      linkedin: { enabled: false },
      notion: { enabled: false },
      slack: { enabled: false },
      spotify: { enabled: false },
      twitch: { enabled: false },
      twitter: { enabled: false },
      workos: { enabled: false },
      ...config.external
    },
    smtp: {
      admin_email: '',
      host: '',
      port: 587,
      user: '',
      pass: '',
      max_frequency: 0,
      sender_name: '',
      ...config.smtp
    }
  })
}

const apiHandler = apiBuilder((builder) => 
  builder
    .useAuth()
    .get(handleGet)
    .patch(handlePatch)
)

export default apiHandler