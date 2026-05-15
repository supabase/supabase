import { Plug } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { ComponentProps } from 'react'
import { Button, cn } from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'
import { useAppStateSnapshot } from '@/state/app-state'

interface ConnectButtonProps {
  buttonType?: ComponentProps<typeof Button>['type']
  className?: string
  iconOnly?: boolean
}

export const ConnectButton = ({
  buttonType = 'default',
  className,
  iconOnly = false,
}: ConnectButtonProps) => {
  const { data: selectedProject } = useSelectedProjectQuery()
  const { setConnectSheetSource } = useAppStateSnapshot()
  const isActiveHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const track = useTrack()

  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))

  return (
    <ButtonTooltip
      type={buttonType}
      disabled={!isActiveHealthy}
      className={cn('rounded-full', className)}
      icon={<Plug className="rotate-90" />}
      onClick={() => {
        track('header_connect_button_clicked')
        setConnectSheetSource('header_button')
        setShowConnect(true)
      }}
      tooltip={{
        content: {
          side: 'bottom',
          text: !isActiveHealthy
            ? 'Project is currently not active and cannot be connected'
            : undefined,
        },
      }}
    >
      <span className={cn({ 'sr-only': iconOnly })}>Connect</span>
    </ButtonTooltip>
  )
}
