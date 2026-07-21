import dayjs from 'dayjs'
import { Pause, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { Activity } from '@/components/interfaces/Observability/DatabaseConnections/Activity'
import { Overview } from '@/components/interfaces/Observability/DatabaseConnections/Overview'
import { ReportPadding } from '@/components/interfaces/Reports/ReportPadding'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import ObservabilityLayout from '@/components/layouts/ObservabilityLayout/ObservabilityLayout'
import type { NextPageWithLayout } from '@/types'

export const DatabaseConnections: NextPageWithLayout = () => {
  const [live, setLive] = useState(true)
  const [now, setNow] = useState(() => dayjs.utc())

  // [Joshen] Just to trigger a UI re-render for the duration to be "live"
  useEffect(() => {
    const interval = setInterval(() => setNow(dayjs.utc()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <ReportPadding className="gap-y-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <h1>Database Connections</h1>
          {live && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="success">
                  <span className="h-1.5 w-1.5 bg-brand rounded-full animate-pulse" />
                  <span>Live</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Data on this page is refreshed every 3 seconds
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-x-2">
          <Button
            variant={live ? 'default' : 'primary'}
            onClick={() => setLive((prev) => !prev)}
            icon={live ? <Pause /> : <Play />}
          >
            {live ? 'Pause' : 'Live'}
          </Button>
        </div>
      </div>

      <Overview live={live} refreshTimestamp={now.toISOString()} />
      <Activity live={live} />
    </ReportPadding>
  )
}

DatabaseConnections.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout title="Database Connections">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default DatabaseConnections
