import { useFlag } from 'common'
import { PropsWithChildren } from 'react'

import { OrganizationResourceBanner } from '../Organization/HeaderBanner'
import { ClockSkewBanner } from '@/components/layouts/AppLayout/ClockSkewBanner'
import { NoticeBanner, NoticeBanner2 } from '@/components/layouts/AppLayout/NoticeBanner'
import { StatusPageBanner } from '@/components/layouts/AppLayout/StatusPageBanner'

export const AppBannerWrapper = ({ children }: PropsWithChildren<{}>) => {
  const showNoticeBanner = useFlag('showNoticeBanner')
  const showNoticeBanner2 = useFlag('showNoticeBanner2')
  const clockSkewBanner = useFlag('clockSkewBanner')

  console.log('showNoticeBanner2?', showNoticeBanner2)

  return (
    <div className="flex flex-col">
      <div className="shrink-0">
        <StatusPageBanner />
        {showNoticeBanner && <NoticeBanner />}
        {showNoticeBanner2 && <NoticeBanner2 />}
        <OrganizationResourceBanner />
        {/* Disabled until reintroduced or removed altogether. */}
        {/* <TaxIdBanner /> */}
        {clockSkewBanner && <ClockSkewBanner />}
      </div>
      {children}
    </div>
  )
}
