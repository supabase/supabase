import { useFlag } from 'common'
import { ClockSkewBanner } from 'components/layouts/AppLayout/ClockSkewBanner'
import { IncidentBanner } from 'components/layouts/AppLayout/IncidentBanner'
import { NoticeBanner } from 'components/layouts/AppLayout/NoticeBanner'
import { PropsWithChildren } from 'react'

import { OrganizationResourceBanner } from '../Organization/HeaderBanner'
import { MaintenanceBanner } from '@/components/layouts/AppLayout/MaintenanceBanner'
import { useIncidentStatusQuery } from '@/data/platform/incident-status-query'

export const AppBannerWrapper = ({ children }: PropsWithChildren<{}>) => {
  const { data: allStatusPageEvents } = useIncidentStatusQuery()
  const { maintenanceEvents = [], incidents = [] } = allStatusPageEvents ?? {}

  // Only show incident banner for incidents with real impact (not "none")
  const hasBannerWorthyIncidents = incidents.some((incident) => incident.impact !== 'none')
  const ongoingIncident =
    useFlag('ongoingIncident') ||
    process.env.NEXT_PUBLIC_ONGOING_INCIDENT === 'true' ||
    hasBannerWorthyIncidents
  const ongoingMaintenance = maintenanceEvents.length > 0

  const showNoticeBanner = useFlag('showNoticeBanner')
  const clockSkewBanner = useFlag('clockSkewBanner')

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0">
        {ongoingIncident ? <IncidentBanner /> : ongoingMaintenance ? <MaintenanceBanner /> : null}
        {showNoticeBanner && <NoticeBanner />}
        <OrganizationResourceBanner />
        {clockSkewBanner && <ClockSkewBanner />}
      </div>
      {children}
    </div>
  )
}
