import { IS_PLATFORM } from 'common'
import { ChevronRight } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useEffect, useRef } from 'react'
import { Card, CardContent, cn } from 'ui'

import { useAvailableConnectModes } from '../ConnectSheet/useAvailableConnectModes'
import { CONNECT_ACTIONS } from './ConnectSection.config'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { BASE_PATH, PROJECT_STATUS } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'
import { useAppStateSnapshot } from '@/state/app-state'

export const ConnectSection = () => {
  const router = useRouter()
  const { data: selectedProject } = useSelectedProjectQuery()
  const { setConnectSheetSource } = useAppStateSnapshot()
  const track = useTrack()
  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))
  const [, setConnectTab] = useQueryState('connectTab', parseAsString)

  const isActiveHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const availableModeIds = useAvailableConnectModes()
  const availableActions = CONNECT_ACTIONS.filter((action) =>
    action.mode ? availableModeIds.includes(action.mode) : true
  )

  const hasTrackedExposure = useRef(false)

  useEffect(() => {
    if (!IS_PLATFORM) return
    if (hasTrackedExposure.current) return
    hasTrackedExposure.current = true
    track('home_connect_section_exposed')
  }, [track])

  const handleActionClick = (action: (typeof CONNECT_ACTIONS)[number]) => {
    track('home_connect_action_clicked', { mode: action.id })

    if (action.mode) {
      setConnectTab(action.mode)
      setConnectSheetSource('connect_section')
      setShowConnect(true)
      return
    }

    if (action.href && selectedProject?.ref) {
      router.push(action.href.replace('[ref]', selectedProject.ref))
    }
  }

  return (
    <section className="w-full">
      <div className="mb-6">
        <h3 className="heading-section">Get connected</h3>
      </div>

      <Card className="bg-background/25 border-dashed relative overflow-hidden">
        <div className="absolute -inset-16 z-0 opacity-50">
          <img
            src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
            alt=""
            className="w-full h-full object-cover object-right hidden dark:block"
          />
          <img
            src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
            alt=""
            className="w-full h-full object-cover object-right dark:hidden"
          />
          <div className="absolute inset-0 bg-linear-to-r from-background-alternative to-transparent" />
        </div>

        <CardContent className="relative z-10 p-0">
          <div className="grid grid-cols-1 xl:grid-cols-5 divide-y xl:divide-y-0 xl:divide-x border-muted">
            {availableActions.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={
                  (action.requiresActiveProject ?? true) ? !isActiveHealthy : !selectedProject?.ref
                }
                onClick={() => handleActionClick(action)}
                className={cn(
                  'group flex items-center gap-3 p-4 text-left transition-colors min-h-[72px] w-full',
                  'hover:bg-surface-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand',
                  'xl:min-h-32 xl:flex-col xl:justify-center xl:p-6 xl:text-center',
                  ((action.requiresActiveProject ?? true)
                    ? !isActiveHealthy
                    : !selectedProject?.ref) && 'cursor-not-allowed opacity-50'
                )}
              >
                <span className="shrink-0 text-foreground-light group-hover:text-foreground">
                  {action.icon}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1 xl:flex-initial">
                  <p className="text-sm">{action.heading}</p>
                  <p className="text-sm text-foreground-lighter">{action.subheading}</p>
                </div>
                <ChevronRight
                  size={16}
                  className="shrink-0 text-foreground-lighter group-hover:text-foreground xl:hidden"
                />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
