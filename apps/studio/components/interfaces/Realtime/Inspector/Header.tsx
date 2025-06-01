import { PlayCircle, StopCircle } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
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
  const { ref } = useParams()
  const org = useSelectedOrganization()

  return (
    <div className="flex flex-row h-14 gap-2.5 items-center px-4">
      <div className="flex flex-row">
        <ChooseChannelPopover config={config} onChangeConfig={onChangeConfig} />
        <RealtimeTokensPopover config={config} onChangeConfig={onChangeConfig} />
        <ButtonTooltip
          size="tiny"
          type={config.enabled ? 'warning' : 'primary'}
          className="rounded-l-none border-l-0"
          disabled={config.channelName.length === 0}
          icon={config.enabled ? <StopCircle size="16" /> : <PlayCircle size="16" />}
          onClick={() => {
            onChangeConfig({ ...config, enabled: !config.enabled })
            if (!config.enabled) {
              // the user has clicked to start listening
              sendEvent({
                action: 'realtime_inspector_listen_channel_clicked',
                groups: {
                  project: ref ?? 'Unknown',
                  organization: org?.slug ?? 'Unknown',
                },
              })
            }
          }}
          tooltip={{
            content: {
              side: 'bottom',
              text:
                config.channelName.length === 0 ? 'You need to join a channel first' : undefined,
            },
          }}
        >
          {config.enabled ? `Stop listening` : `Start listening`}
        </ButtonTooltip>
      </div>
      <RealtimeFilterPopover config={config} onChangeConfig={onChangeConfig} />
    </div>
  )
}
