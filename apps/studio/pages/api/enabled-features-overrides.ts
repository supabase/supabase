import { IS_PLATFORM } from 'common'
import { getEnabledFeaturesOverrideDisabledList } from 'common/enabled-features/overrides'
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end()
  }

  if (IS_PLATFORM) {
    return res.status(200).json({ disabled_features: [] })
  }

  return res.status(200).json({
    disabled_features: getEnabledFeaturesOverrideDisabledList(process.env),
  })
}
