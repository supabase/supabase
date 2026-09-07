import { LOCAL_STORAGE_KEYS } from 'common'
import { useParams } from 'common/hooks'
import Link from 'next/link'
import { Badge, Button, WarningIcon } from 'ui'

import { BannerCard } from '../BannerCard'
import { useBannerStack } from '../BannerStackProvider'
import {
  useFeaturePreviewModal,
  useIsDatabaseConnectionsEnabled,
} from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useTrack } from '@/lib/telemetry/track'

export const BannerDatabaseConnections = () => {
  const track = useTrack()
  const { ref } = useParams()
  const { dismissBanner } = useBannerStack()
  const { selectFeaturePreview } = useFeaturePreviewModal()

  const [, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.DATABASE_CONNECTIONS_BANNER_DISMISSED(ref ?? ''),
    false
  )

  const { enabled: isEnabled } = useIsDatabaseConnectionsEnabled()

  return (
    <BannerCard
      onDismiss={() => {
        setIsDismissed(true)
        dismissBanner('database-connections-banner')
        track('database_connections_banner_dismiss_button_clicked')
      }}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-2 items-start w-full">
          <Badge variant="success" className="-ml-0.5 uppercase inline-flex items-center">
            Preview
          </Badge>
          <div className="-mx-6 w-[calc(100%+3rem)] bg-linear-to-t from-background to-transparent px-6 py-2 border-b">
            <div className="flex items-center gap-x-2">
              <div>
                <WarningIcon />
              </div>
              <p className="text-xs font-mono uppercase tracking-tigher text-warning">Blocking</p>
              <p className="truncate text-xs font-mono tracking-tighter">
                update orders set status = $1 where id = $2;
              </p>
            </div>
            <div className="pl-[7.5px]">
              <div className="relative flex items-center gap-x-2 pl-4 pt-2 pb-1">
                <div className="absolute left-0 top-0 h-full border-l border-stronger" />
                <div className="absolute left-0 top-1/2 w-3 border-b border-stronger" />
                <p className="text-xs font-mono uppercase tracking-tigher text-foreground-light">
                  Waiting
                </p>
                <p className="truncate text-xs font-mono tracking-tighter text-foreground-lighter">
                  select * from orders where id = $1 for update
                </p>
              </div>
              <div className="relative flex items-center gap-x-2 pl-4 py-1">
                <div className="absolute left-0 top-0 h-1/2 w-3 border-l border-b border-stronger rounded-bl-md" />
                <p className="text-xs font-mono uppercase tracking-tigher text-foreground-light">
                  Waiting
                </p>
                <p className="truncate text-xs font-mono tracking-tighter text-foreground-lighter">
                  update orders set status = $1 where id = $2;
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">Diagnose blocked queries</p>
          <p className="text-xs text-foreground-lighter text-balance">
            See what's blocking your database and terminate the session causing it.
          </p>
        </div>
        <div className="flex gap-2">
          {isEnabled ? (
            <Button
              asChild
              variant="default"
              size="tiny"
              onClick={() => {
                setIsDismissed(true)
                dismissBanner('database-connections-banner')
                track('database_connections_banner_cta_button_clicked', { isEnabled })
              }}
            >
              <Link href={`/project/${ref}/observability/connections`}>
                Explore Database Connections
              </Link>
            </Button>
          ) : (
            <Button
              variant="default"
              size="tiny"
              onClick={() => {
                selectFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_DATABASE_CONNECTIONS)
                track('database_connections_banner_cta_button_clicked', { isEnabled: false })
              }}
            >
              Enable Database Connections
            </Button>
          )}
        </div>
      </div>
    </BannerCard>
  )
}
