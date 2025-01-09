import { PlayCircle, StopCircle } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'

import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { TelemetryActions } from 'lib/constants/telemetry'
import { Button, Tooltip_Shadcn_, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_ } from 'ui'
import { ChooseChannelPopover } from './ChooseChannelPopover'
import { RealtimeFilterPopover } from './RealtimeFilterPopover'
import { RealtimeTokensPopover } from './RealtimeTokensPopover'
import { RealtimeConfig } from './useRealtimeMessages'

interface HeaderProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

export const Header = ({ config, onChangeConfig }: HeaderProps) => {
  const { mutate: sendEvent } = useSendEventMutation()

  return (
    <div className="flex flex-row h-14 gap-2.5 items-center px-4">
      <div className="flex flex-row">
        <ChooseChannelPopover config={config} onChangeConfig={onChangeConfig} />
        <RealtimeTokensPopover config={config} onChangeConfig={onChangeConfig} />
        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_ asChild>
            <Button
              size="tiny"
              type={config.enabled ? 'warning' : 'primary'}
              className="rounded-l-none border-l-0"
              disabled={config.channelName.length === 0}
              icon={config.enabled ? <StopCircle size="16" /> : <PlayCircle size="16" />}
              onClick={() => {
                onChangeConfig({ ...config, enabled: !config.enabled })
                if (!config.enabled) {
                  // the user has clicked to start listening
                  sendEvent({ action: TelemetryActions.REALTIME_INSPECTOR_LISTEN_CHANNEL_CLICKED })
                }
              }}
            >
              {config.enabled ? `Stop listening` : `Start listening`}
            </Button>
          </TooltipTrigger_Shadcn_>
          {config.channelName.length === 0 && (
            <TooltipContent_Shadcn_ side="bottom">
              You'll need to join a channel first
            </TooltipContent_Shadcn_>
          )}
        </Tooltip_Shadcn_>
      </div>
      <RealtimeFilterPopover config={config} onChangeConfig={onChangeConfig} />
    </div>
  )
}
