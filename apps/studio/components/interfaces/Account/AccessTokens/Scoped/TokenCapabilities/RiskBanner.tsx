import { Admonition } from 'ui-patterns/Admonition'
import type { AdmonitionType } from 'ui-patterns/Admonition'

import type { RiskBannerResult } from './TokenCapabilities.utils'

const TONE_TO_ADMONITION_TYPE: Record<RiskBannerResult['tone'], AdmonitionType> = {
  default: 'default',
  low: 'success',
  medium: 'warning',
  high: 'destructive',
}

interface RiskBannerProps {
  risk: RiskBannerResult
  /** True when some selected permissions exceed the owner's role, so the risk is role-capped. */
  showRoleCaveat: boolean
}

export const RiskBanner = ({ risk, showRoleCaveat }: RiskBannerProps) => (
  <Admonition
    type={TONE_TO_ADMONITION_TYPE[risk.tone]}
    title={`${risk.level} risk`}
    description={risk.summary}
  >
    {showRoleCaveat && 'Based on what your current role allows this token to do.'}
  </Admonition>
)
