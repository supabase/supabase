import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { TimestampInfo } from 'ui-patterns'

import { HeaderBanner } from '@/components/interfaces/Organization/HeaderBanner'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

// Update this whenever the banner content below changes so old client bundles
// stop displaying outdated notices after the relevant date passes.
const BANNER_EXPIRES_AT = new Date('2026-06-09T15:00:00Z')

const SUPAVISOR_UPDATE_REGIONS = {
  'eu-central-1': {
    start: Date.UTC(2026, 4, 26, 13, 0, 0),
    end: Date.UTC(2026, 4, 26, 15, 0, 0),
    url: 'https://status.supabase.com/incidents/jy1tm4wfs68t',
  },
  'eu-west-2': {
    start: Date.UTC(2026, 5, 9, 13, 0, 0),
    end: Date.UTC(2026, 5, 9, 15, 0, 0),
    url: 'https://status.supabase.com/incidents/3t293hpd545z',
  },
  'us-west-1': {
    start: Date.UTC(2026, 5, 2, 16, 0, 0),
    end: Date.UTC(2026, 5, 2, 18, 0, 0),
    url: 'https://status.supabase.com/incidents/8f72bnv3xs8r',
  },
  'us-east-1': {
    start: Date.UTC(2026, 5, 3, 13, 0, 0),
    end: Date.UTC(2026, 5, 3, 15, 0, 0),
    url: 'https://status.supabase.com/incidents/y8rp6dwjyplw',
  },
}

/**
 * Used to display urgent notices that apply for all users, such as maintenance windows.
 */
export const NoticeBanner = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [bannerAcknowledged, setBannerAcknowledged, { isSuccess }] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SUPAVISOR_MAINTENANCE(ref ?? ''),
    false
  )

  const region = project?.region ?? ''
  const maintenanceWindow =
    SUPAVISOR_UPDATE_REGIONS[region as keyof typeof SUPAVISOR_UPDATE_REGIONS]

  if (
    Date.now() >= BANNER_EXPIRES_AT.getTime() ||
    router.pathname.includes('sign-in') ||
    !isSuccess ||
    !project ||
    !maintenanceWindow ||
    bannerAcknowledged
  ) {
    return null
  }

  return (
    <HeaderBanner
      variant="note"
      title="Upcoming maintenance"
      description={
        <>
          Shared pooler maintenance in{' '}
          <a target="_blank" rel="noopener referrer" href={maintenanceWindow.url}>
            {project.region}
          </a>{' '}
          on{' '}
          <TimestampInfo
            className="text-sm"
            utcTimestamp={maintenanceWindow.start}
            label={dayjs(maintenanceWindow.start).format('DD MMM, HH:mm')}
          />
          .
        </>
      }
      onDismiss={() => setBannerAcknowledged(true)}
    />
  )
}
