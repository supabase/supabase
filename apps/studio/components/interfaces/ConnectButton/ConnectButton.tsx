import { Plug } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { ComponentProps } from 'react'
import { Button, cn } from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'
import { useAppStateSnapshot } from '@/state/app-state'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

interface ConnectButtonProps {
  buttonVariant?: ComponentProps<typeof Button>['variant']
  className?: string
  iconOnly?: boolean
}

export const ConnectButton = ({
  buttonVariant = 'default',
  className,
  iconOnly = false,
}: ConnectButtonProps) => {
  const { data: selectedProject } = useSelectedProjectQuery()
  const { setConnectSheetSource } = useAppStateSnapshot()
  const isActiveHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const track = useTrack()

  const [showConnect, setShowConnect] = useQueryState(
    'showConnect',
    parseAsBoolean.withDefault(false)
  )

  if (isActiveHealthy) {
    return (
      <ShortcutTooltip
        shortcutId={SHORTCUT_IDS.CONNECT_OPEN_SHEET}
        side="bottom"
        open={showConnect ? false : undefined}
      >
        <Button
          variant={buttonVariant}
          disabled={!isActiveHealthy}
          className={cn('rounded-full', className)}
          icon={<Plug className="rotate-90" />}
          onClick={() => {
            track('header_connect_button_clicked')
            setConnectSheetSource('header_button')
            setShowConnect(true)
          }}
        >
          <span className={cn({ 'sr-only': iconOnly })}>Connect</span>
        </Button>
      </ShortcutTooltip>
    )
  }

  return (
    <ButtonTooltip
      variant={buttonVariant}
      disabled
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
          text: 'Project is currently not active and cannot be connected',
        },
      }}
    >
      <span className={cn({ 'sr-only': iconOnly })}>Connect</span>
    </ButtonTooltip>
  )
}
