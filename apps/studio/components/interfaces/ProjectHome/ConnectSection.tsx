import { IS_PLATFORM } from 'common'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { BASE_PATH, PROJECT_STATUS } from 'lib/constants'
import { useTrack } from 'lib/telemetry/track'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useEffect, useRef } from 'react'
import { Card, CardContent, cn } from 'ui'

import type { ConnectMode } from '../ConnectSheet/Connect.types'
import { useAvailableConnectModes } from '../ConnectSheet/useAvailableConnectModes'
import { useAppStateSnapshot } from '@/state/app-state'
import { CONNECT_ACTIONS, type ConnectSectionVariant } from './ConnectSection.config'

interface ConnectSectionProps {
  variant: ConnectSectionVariant
}

export const ConnectSection = ({ variant }: ConnectSectionProps) => {
  const { data: selectedProject } = useSelectedProjectQuery()
  const { setConnectSheetSource } = useAppStateSnapshot()
  const track = useTrack()
  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))
  const [, setConnectTab] = useQueryState('connectTab', parseAsString)

  const isActiveHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const availableModeIds = useAvailableConnectModes()
  const availableActions = CONNECT_ACTIONS.filter((action) =>
    availableModeIds.includes(action.mode)
  )

  const hasTrackedExposure = useRef(false)

  useEffect(() => {
    if (!IS_PLATFORM) return
    if (hasTrackedExposure.current) return
    hasTrackedExposure.current = true
    track('home_connect_section_exposed', { variant })
  }, [variant, track])

  const handleConnectClick = (mode: ConnectMode) => {
    track('home_connect_action_clicked', { mode })
    setConnectTab(mode)
    setConnectSheetSource('connect_section')
    setShowConnect(true)
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
          <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
        </div>

        <CardContent className="relative z-10 p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-muted">
            {availableActions.map((action) => (
              <button
                key={action.mode}
                type="button"
                disabled={!isActiveHealthy}
                onClick={() => handleConnectClick(action.mode)}
                className={cn(
                  'group flex flex-col items-center justify-center gap-3 p-6 text-center transition-colors min-h-32',
                  'hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                  !isActiveHealthy && 'cursor-not-allowed opacity-50'
                )}
              >
                <span className="text-foreground-light group-hover:text-foreground">
                  {action.icon}
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-sm">{action.heading}</p>
                  <p className="text-sm text-foreground-lighter">{action.subheading}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
