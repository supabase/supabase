import { useFlag } from 'common'
import { PropsWithChildren } from 'react'

import { OrganizationResourceBanner } from '../Organization/HeaderBanner'
import { ClockSkewBanner } from '@/components/layouts/AppLayout/ClockSkewBanner'
import { NoticeBanner } from '@/components/layouts/AppLayout/NoticeBanner'
import { StatusPageBanner } from '@/components/layouts/AppLayout/StatusPageBanner'
import { TaxIdBanner } from '@/components/layouts/AppLayout/TaxIdBanner'

export const AppBannerWrapper = ({ children }: PropsWithChildren<{}>) => {
  const showNoticeBanner = useFlag('showNoticeBanner')
  const clockSkewBanner = useFlag('clockSkewBanner')

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0">
        <StatusPageBanner />
        {showNoticeBanner && <NoticeBanner />}
        <OrganizationResourceBanner />
        <TaxIdBanner />
        {clockSkewBanner && <ClockSkewBanner />}
      </div>
      {children}
    </div>
  )
}
