import { LOCAL_STORAGE_KEYS } from 'common'
import dayjs from 'dayjs'
import { CirclePause, CirclePlay, TextSearch } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import {
  useFeaturePreviewModal,
  useIsDatabaseConnectionsEnabled,
} from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { Activity } from '@/components/interfaces/Observability/DatabaseConnections/Activity'
import { buildDatabaseConnectionsSummaryPrompt } from '@/components/interfaces/Observability/DatabaseConnections/DatabaseConnections.ai'
import { Overview } from '@/components/interfaces/Observability/DatabaseConnections/Overview'
import { ReportPadding } from '@/components/interfaces/Reports/ReportPadding'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import ObservabilityLayout from '@/components/layouts/ObservabilityLayout/ObservabilityLayout'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from '@/components/ui/AiAssistantDropdown'
import { FeaturePreviewBadge } from '@/components/ui/FeaturePreviewBadge'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useDatabaseActivityQuery } from '@/data/database/activity-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'
import type { NextPageWithLayout } from '@/types'

export const DatabaseConnections: NextPageWithLayout = () => {
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const { enabled: isDatabaseConnectionsEnabled } = useIsDatabaseConnectionsEnabled()
  const { selectFeaturePreview } = useFeaturePreviewModal()

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
    {
      enabled: isDatabaseConnectionsEnabled,
      refetchOnWindowFocus: live,
      refetchInterval: live ? 3000 : false,
    }
  )

  function handleToggleLive() {
    const nextLive = !live

    track('database_connections_live_mode_clicked', {
      newState: nextLive ? 'enabled' : 'disabled',
    })

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
    if (!live || !isDatabaseConnectionsEnabled) return
    const interval = setInterval(() => setNow(dayjs.utc()), 1000)
    return () => clearInterval(interval)
  }, [live, isDatabaseConnectionsEnabled])

  return (
    <ReportPadding className="gap-y-12">
      <div className="flex items-center justify-between gap-x-4">
        <div className="flex items-center gap-x-2">
          <h1 className="w-max">Database Connections</h1>
          <FeaturePreviewBadge featureKey={LOCAL_STORAGE_KEYS.UI_PREVIEW_DATABASE_CONNECTIONS} />
          {isDatabaseConnectionsEnabled && live && (
            <Tooltip>
              <TooltipTrigger className="flex items-center">
                <Badge variant="success">
                  <span className="h-1.5 w-1.5 bg-brand rounded-full animate-pulse" />
                  <span>Live</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom">Refreshes data every 3 seconds</TooltipContent>
            </Tooltip>
          )}
        </div>

        {isDatabaseConnectionsEnabled && (
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
              loading={isLoadingActivity}
              telemetrySource="database_connections"
              size="tiny"
              variant="default"
            />
          </div>
        )}
      </div>

      {!isDatabaseConnectionsEnabled && (
        <EmptyStatePresentational
          icon={<TextSearch />}
          title="Diagnose stuck and blocked queries"
          description="See every session on your database in real time, spot the ones that are slow, idle in a transaction, or blocked, and terminate the one holding things up"
        >
          <Button
            variant="default"
            onClick={() => selectFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_DATABASE_CONNECTIONS)}
          >
            Enable feature preview
          </Button>
        </EmptyStatePresentational>
      )}

      {isDatabaseConnectionsEnabled && (
        <>
          <Overview live={live} />
          <Activity live={live} />
        </>
      )}
    </ReportPadding>
  )
}

DatabaseConnections.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout title="Database Connections">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default DatabaseConnections
