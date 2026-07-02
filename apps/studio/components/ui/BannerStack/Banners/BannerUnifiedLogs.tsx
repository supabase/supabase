import { LOCAL_STORAGE_KEYS } from 'common'
import { useParams } from 'common/hooks'
import Link from 'next/link'
import { Badge, Button } from 'ui'

import { BannerCard } from '../BannerCard'
import { useBannerStack } from '../BannerStackProvider'
import { UnifiedLogsCarousel } from './UnifiedLogsCarousel'
import {
  useFeaturePreviewModal,
  useUnifiedLogsPreview,
} from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useTrack } from '@/lib/telemetry/track'

export const BannerUnifiedLogs = () => {
  const { ref } = useParams()
  const track = useTrack()
  const { dismissBanner } = useBannerStack()
  const { isEnabled } = useUnifiedLogsPreview()
  const { selectFeaturePreview } = useFeaturePreviewModal()
  const [, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.UNIFIED_LOGS_BANNER_DISMISSED,
    false
  )

  return (
    <BannerCard
      onDismiss={() => {
        setIsDismissed(true)
        dismissBanner('unified-logs-banner')
        track('unified_logs_banner_dismiss_button_clicked')
      }}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-2 items-start">
          <Badge variant="success" className="-ml-0.5 uppercase inline-flex items-center">
            Beta
          </Badge>
          <div className="-mx-6 w-[calc(100%+3rem)] bg-linear-to-t from-background to-transparent px-6 py-2 border-b">
            <UnifiedLogsCarousel />
          </div>
        </div>
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">Unified Logs is here</p>
          <p className="text-xs text-foreground-lighter text-balance">
            Search and correlate logs across all of your services from a single place.
          </p>
        </div>
        <div className="flex gap-2">
          {isEnabled ? (
            <Button variant="default" size="tiny" asChild>
              <Link
                href={`/project/${ref}/logs`}
                onClick={() => {
                  track('unified_logs_banner_cta_button_clicked', { is_enabled: true })
                  setIsDismissed(true)
                  dismissBanner('unified-logs-banner')
                }}
              >
                Explore Unified Logs
              </Link>
            </Button>
          ) : (
            <Button
              variant="default"
              size="tiny"
              onClick={() => {
                track('unified_logs_banner_cta_button_clicked', { is_enabled: false })
                selectFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS)
              }}
            >
              Enable Unified Logs
            </Button>
          )}
        </div>
      </div>
    </BannerCard>
  )
}
