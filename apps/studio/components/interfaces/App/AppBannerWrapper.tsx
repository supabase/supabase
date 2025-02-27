import { PropsWithChildren } from 'react'

import { ClockSkewBanner } from 'components/layouts/AppLayout/ClockSkewBanner'
import IncidentBanner from 'components/layouts/AppLayout/IncidentBanner'
import { NoticeBanner } from 'components/layouts/AppLayout/NoticeBanner'
import { RestrictionBanner } from 'components/layouts/AppLayout/RestrictionBanner'
import { useFlag } from 'hooks/ui/useFlag'
import { useProfile } from 'lib/profile'

const AppBannerWrapper = ({ children }: PropsWithChildren<{}>) => {
  const { profile } = useProfile()

  const ongoingIncident = useFlag('ongoingIncident')
  const showNoticeBanner = useFlag('showNoticeBanner')
  const clockSkewBanner = useFlag('clockSkewBanner')

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0">
        {ongoingIncident && <IncidentBanner />}
        {showNoticeBanner && <NoticeBanner />}
        {profile !== undefined && <RestrictionBanner />}
        {clockSkewBanner && <ClockSkewBanner />}
      </div>
      {children}
    </div>
  )
}

export default AppBannerWrapper
