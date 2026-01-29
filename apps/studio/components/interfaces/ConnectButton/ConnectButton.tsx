import { Connect } from 'components/interfaces/Connect/Connect'
import { ConnectSheet } from 'components/interfaces/ConnectSheet/ConnectSheet'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { usePHFlag } from 'hooks/ui/useFlag'
import { PROJECT_STATUS } from 'lib/constants'
import { Plug } from 'lucide-react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { ComponentProps } from 'react'
import { Button } from 'ui'

interface ConnectButtonProps {
  buttonType?: ComponentProps<typeof Button>['type']
  renderDialog?: boolean
}

export const ConnectButton = ({
  buttonType = 'default',
  renderDialog = true,
}: ConnectButtonProps) => {
  const connectSheetFlag = usePHFlag<string | boolean>('connectSheet')
  const isFlagResolved = connectSheetFlag !== undefined
  const isConnectSheetEnabled = connectSheetFlag === true || connectSheetFlag === 'variation'

  const { data: selectedProject } = useSelectedProjectQuery()
  const isActiveHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const [showConnect, setShowConnect] = useQueryState(
    'showConnect',
    parseAsBoolean.withDefault(false)
  )
  const [connectTab, setConnectTab] = useQueryState('connectTab', parseAsString)

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setShowConnect(null)
      setConnectTab(null)
      return
    }

    setShowConnect(true)
  }

  if (!isActiveHealthy) {
    return (
      <ButtonTooltip
        disabled
        type="default"
        className="rounded-full"
        icon={<Plug className="rotate-90" />}
        tooltip={{
          content: {
            side: 'bottom',
            text: 'Project is currently not active and cannot be connected',
          },
        }}
      >
        Connect
      </ButtonTooltip>
    )
  }

  return (
    <>
      <Button
        type={buttonType}
        className="rounded-full"
        icon={<Plug className="rotate-90" />}
        onClick={() => handleOpenChange(true)}
      >
        <span>Connect</span>
      </Button>
      {renderDialog && isFlagResolved ? (
        isConnectSheetEnabled ? (
          <ConnectSheet
            open={showConnect}
            onOpenChange={handleOpenChange}
            connectTab={connectTab}
          />
        ) : (
          <Connect open={showConnect} onOpenChange={handleOpenChange} />
        )
      ) : null}
    </>
  )
}
