import { useFlag } from 'common'
import { ClockSkewBanner } from 'components/layouts/AppLayout/ClockSkewBanner'
import { NoticeBanner } from 'components/layouts/AppLayout/NoticeBanner'
import { StatusPageBanner } from 'components/layouts/AppLayout/StatusPageBanner'
import { PropsWithChildren } from 'react'

import { OrganizationResourceBanner } from '../Organization/HeaderBanner'
import { useIsSystemStatusBadgeEnabled } from './FeaturePreview/FeaturePreviewContext'

export const AppBannerWrapper = ({ children }: PropsWithChildren<{}>) => {
  const showNoticeBanner = useFlag('showNoticeBanner')
  const clockSkewBanner = useFlag('clockSkewBanner')
  const isSystemStatusBadgeEnabled = useIsSystemStatusBadgeEnabled()

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0">
        {!isSystemStatusBadgeEnabled && <StatusPageBanner />}
        {showNoticeBanner && <NoticeBanner />}
        <OrganizationResourceBanner />
        {clockSkewBanner && <ClockSkewBanner />}
      </div>
      {children}
    </div>
  )
}
