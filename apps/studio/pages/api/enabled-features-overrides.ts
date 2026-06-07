import { getEnabledFeaturesOverrideDisabledList } from 'common/enabled-features/overrides'
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end()
  }

  // [console fork] Our console runs in platform mode, but it IS the self-hosted
  // platform — so ENABLED_FEATURES_* env overrides must still apply (upstream
  // short-circuited these for hosted Supabase).
  const envDisabled = getEnabledFeaturesOverrideDisabledList(process.env)

  // [console fork] Self-host policy: public account sign-up is always disabled
  // (admins are created during install / via invite, never self-serve). This is
  // enforced programmatically, not via env, and mirrors disableSignUp on the API.
  const alwaysDisabled = ['dashboard_auth:sign_up']

  return res.status(200).json({
    disabled_features: Array.from(new Set([...envDisabled, ...alwaysDisabled])),
  })
}
