import { PropsWithChildren } from 'react'

import { useFlag } from 'common'
import { ClockSkewBanner } from 'components/layouts/AppLayout/ClockSkewBanner'
import IncidentBanner from 'components/layouts/AppLayout/IncidentBanner'
import { NoticeBanner } from 'components/layouts/AppLayout/NoticeBanner'
import { OrganizationResourceBanner } from '../Organization/HeaderBanner'

const AppBannerWrapper = ({ children }: PropsWithChildren<{}>) => {
  const ongoingIncident = useFlag('ongoingIncident')
  const showNoticeBanner = useFlag('showNoticeBanner')
  const clockSkewBanner = useFlag('clockSkewBanner')

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0">
        {ongoingIncident && <IncidentBanner />}
        {showNoticeBanner && <NoticeBanner />}
        <OrganizationResourceBanner />
        {clockSkewBanner && <ClockSkewBanner />}
      </div>
      {children}
    </div>
  )
}

export default AppBannerWrapper
