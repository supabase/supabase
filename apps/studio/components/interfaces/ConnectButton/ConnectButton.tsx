import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Plug } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { ComponentProps } from 'react'
import { Button, cn } from 'ui'

import { PROJECT_STATUS } from '@/lib/constants'

interface ConnectButtonProps {
  buttonType?: ComponentProps<typeof Button>['type']
  className?: string
}

export const ConnectButton = ({ buttonType = 'default', className }: ConnectButtonProps) => {
  const { data: selectedProject } = useSelectedProjectQuery()
  const isActiveHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))

  return (
    <ButtonTooltip
      type={buttonType}
      disabled={!isActiveHealthy}
      className={cn('rounded-full', className)}
      icon={<Plug className="rotate-90" />}
      onClick={() => setShowConnect(true)}
      tooltip={{
        content: {
          side: 'bottom',
          text: !isActiveHealthy
            ? 'Project is currently not active and cannot be connected'
            : undefined,
        },
      }}
    >
      <span>Connect</span>
    </ButtonTooltip>
  )
}
