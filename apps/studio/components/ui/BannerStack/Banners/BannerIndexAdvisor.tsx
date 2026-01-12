import { LOCAL_STORAGE_KEYS } from 'common'
import { useParams } from 'common/hooks'
import { EnableIndexAdvisorButton } from 'components/interfaces/QueryPerformance/IndexAdvisor/EnableIndexAdvisorButton'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useTrack } from 'lib/telemetry/track'
import { Lightbulb } from 'lucide-react'
import { BannerCard } from '../BannerCard'
import { useBannerStack } from '../BannerStackProvider'

export const BannerIndexAdvisor = () => {
  const track = useTrack()
  const { ref } = useParams()
  const { dismissBanner } = useBannerStack()
  const [, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.INDEX_ADVISOR_NOTICE_DISMISSED(ref ?? ''),
    false
  )

  return (
    <BannerCard
      onDismiss={() => {
        setIsDismissed(true)
        dismissBanner('index-advisor-banner')
        track('index_advisor_banner_dismiss_button_clicked')
      }}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-2 items-start">
          <div className="p-2 rounded-lg bg-warning-300 text-warning">
            <Lightbulb size={16} />
          </div>
        </div>
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">Enable Index Advisor</p>
          <p className="text-xs text-foreground-lighter text-balance">
            Recommends indexes to improve query performance.
          </p>
        </div>
        <div className="flex gap-2">
          <EnableIndexAdvisorButton />
        </div>
      </div>
    </BannerCard>
  )
}
