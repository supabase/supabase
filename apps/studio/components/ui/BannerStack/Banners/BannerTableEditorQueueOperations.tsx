import { LOCAL_STORAGE_KEYS } from 'common'
import { useParams } from 'common/hooks'
import Link from 'next/link'
import { Badge, Button, Card, CardContent, CardHeader } from 'ui'

import { BannerCard } from '../BannerCard'
import { useBannerStack } from '../BannerStackProvider'
import { useIsQueueOperationsEnabled } from '@/components/interfaces/Account/Preferences/useDashboardSettings'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

const DASHBOARD_SETTINGS_URL = '/account/me#dashboard'

export const BannerTableEditorQueueOperations = () => {
  const { ref } = useParams()
  const isQueueOperationsEnabled = useIsQueueOperationsEnabled()

  const { dismissBanner } = useBannerStack()
  const [, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TABLE_EDITOR_QUEUE_OPERATIONS_BANNER_DISMISSED(ref ?? ''),
    false
  )

  return (
    <BannerCard
      onDismiss={() => {
        setIsDismissed(true)
        dismissBanner('table-editor-queue-operations-banner')
      }}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-2 items-start">
          <Badge variant="success" className="-ml-0.5 uppercase inline-flex items-center mb-2">
            New
          </Badge>
          <Card className="text-xs w-full">
            <CardHeader className="flex flex-row gap-2 px-2 py-2">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-foreground ml-0.5">
                  <span>name</span>
                  <span className="text-foreground-muted mx-1.5">·</span>
                  <span>where id = 10</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="font-mono text-xs px-2 py-1">
              <div className="flex gap-2 py-0.5">
                <span className="text-destructive select-none font-medium">-</span>
                <span className="text-destructive truncate max-w-full">Red</span>
              </div>

              <div className="flex gap-2 py-0.5">
                <span className="text-brand-link select-none font-medium">+</span>
                <span className="text-brand-link truncate max-w-full">Blue</span>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">Queue row edits in Table Editor</p>
          <p className="text-xs text-foreground-lighter text-balance">
            Batch multiple row edits and review them before saving to your database
          </p>
        </div>
        <Button asChild type="default" className="w-min">
          <Link href={DASHBOARD_SETTINGS_URL}>
            {isQueueOperationsEnabled ? 'View' : 'Enable in'} preferences
          </Link>
        </Button>
      </div>
    </BannerCard>
  )
}
