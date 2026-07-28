import dayjs from 'dayjs'
import { CirclePause, CirclePlay } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { Activity } from '@/components/interfaces/Observability/DatabaseConnections/Activity'
import { buildDatabaseConnectionsSummaryPrompt } from '@/components/interfaces/Observability/DatabaseConnections/DatabaseConnections.ai'
import { Overview } from '@/components/interfaces/Observability/DatabaseConnections/Overview'
import { ReportPadding } from '@/components/interfaces/Reports/ReportPadding'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import ObservabilityLayout from '@/components/layouts/ObservabilityLayout/ObservabilityLayout'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from '@/components/ui/AiAssistantDropdown'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useDatabaseActivityQuery } from '@/data/database/activity-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'
import type { NextPageWithLayout } from '@/types'

export const DatabaseConnections: NextPageWithLayout = () => {
  const { data: project } = useSelectedProjectQuery()
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()

  const [live, setLive] = useState(true)
  const [now, setNow] = useState(() => dayjs.utc())

  useShortcut(SHORTCUT_IDS.DATA_TABLE_TOGGLE_LIVE, handleToggleLive, {
    registerInCommandMenu: false,
  })

  const {
    data,
    isPending: isLoadingActivity,
    refetch: refetchActivity,
  } = useDatabaseActivityQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { refetchOnWindowFocus: live, refetchInterval: live ? 3000 : false }
  )

  function handleToggleLive() {
    const nextLive = !live
    setLive(nextLive)
    if (nextLive) {
      setNow(dayjs.utc())
      refetchActivity()
    }
  }

  const buildPrompt = () => {
    return buildDatabaseConnectionsSummaryPrompt({
      activities: data ?? [],
      timestamp: now.toISOString(),
    })
  }

  const handleSummarizeActivity = () => {
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    const prompt = buildPrompt()
    aiSnap.newChat({
      name: `DB Connections Summary ${dayjs().format('DD/MM/YYYY HH:mm')}`,
      initialMessage: prompt,
    })
  }

  // [Joshen] Just to trigger a UI re-render for the duration to be "live"
  useEffect(() => {
    if (!live) return
    const interval = setInterval(() => setNow(dayjs.utc()), 1000)
    return () => clearInterval(interval)
  }, [live])

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
              <TooltipContent side="bottom">Refreshes data every 3 seconds</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-x-2">
          <ShortcutTooltip
            shortcutId={SHORTCUT_IDS.DATA_TABLE_TOGGLE_LIVE}
            label={live ? 'Pause live mode' : 'Refresh data every 3 seconds'}
            side="bottom"
          >
            <Button
              variant={live ? 'default' : 'primary'}
              onClick={handleToggleLive}
              icon={live ? <CirclePause /> : <CirclePlay />}
            >
              {live ? 'Pause' : 'Live'}
            </Button>
          </ShortcutTooltip>
          <AiAssistantDropdown
            label="Summarize activity"
            buildPrompt={buildPrompt}
            onOpenAssistant={handleSummarizeActivity}
            disabled={isLoadingActivity}
            isLoading={isLoadingActivity}
            // @ts-ignore [Joshen] To add proper telemetry source in subsequent PR
            telemetrySource="database_connections"
            size="tiny"
            variant="default"
          />
        </div>
      </div>

      <Overview live={live} />
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
