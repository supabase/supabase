import { useParams } from 'common/hooks'
import { BannerCard } from '../BannerCard'
import { useTrack } from 'lib/telemetry/track'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS } from 'common'
import { Badge } from 'ui'
import { LOG_DRAIN_TYPES } from 'components/interfaces/LogDrains/LogDrains.constants'
import React from 'react'
import { Button } from 'ui'
import Link from 'next/link'
import { DOCS_URL } from 'lib/constants'
import { useBannerStack } from '../BannerStackProvider'

export const BannerMetricsAPI = () => {
  const { ref } = useParams()
  const track = useTrack()
  const { dismissBanner } = useBannerStack()
  const [, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.OBSERVABILITY_BANNER_DISMISSED(ref ?? ''),
    false
  )
  return (
    <BannerCard
      onDismiss={() => {
        setIsDismissed(true)
        dismissBanner('metrics-api-banner')
        track('metrics_api_banner_dismiss_button_clicked')
      }}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-2 items-start">
          <Badge variant="success" className="-ml-0.5 uppercase inline-flex items-center mb-2">
            Beta
          </Badge>
          <div className="flex items-center gap-4">
            {LOG_DRAIN_TYPES.filter((type) => type.value !== 'sentry').map((type) => (
              <React.Fragment key={type.value}>
                {React.cloneElement(type.icon, { height: 20, width: 20 })}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">Export Metrics to your dashboards</p>
          <p className="text-xs text-foreground-lighter text-balance">
            Visualize over 200 database performance and health metrics with our Metrics API.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="default" size="tiny" asChild>
            <Link
              href={`${DOCS_URL}/guides/telemetry/metrics`}
              target="_blank"
              onClick={() => track('metrics_api_banner_cta_button_clicked')}
            >
              Get started for free
            </Link>
          </Button>
        </div>
      </div>
    </BannerCard>
  )
}
