import * as Tooltip from '@radix-ui/react-tooltip'
import { PlayCircle, StopCircle } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'
import { Button } from 'ui'

import { useTelemetryProps } from 'common'
import Telemetry from 'lib/telemetry'
import { useRouter } from 'next/router'
import { ChooseChannelPopover } from './ChooseChannelPopover'
import { RealtimeFilterPopover } from './RealtimeFilterPopover'
import { RealtimeTokensPopover } from './RealtimeTokensPopover'
import { RealtimeConfig } from './useRealtimeMessages'

interface HeaderProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

export const Header = ({ config, onChangeConfig }: HeaderProps) => {
  const telemetryProps = useTelemetryProps()
  const router = useRouter()

  return (
    <div className="flex flex-row h-14 gap-2.5 items-center px-4">
      <div className="flex flex-row">
        <ChooseChannelPopover config={config} onChangeConfig={onChangeConfig} />
        <RealtimeTokensPopover config={config} onChangeConfig={onChangeConfig} />
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger asChild>
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
                  Telemetry.sendEvent(
                    {
                      category: 'realtime_inspector',
                      action: 'started_listening',
                      label: 'realtime_inspector_config',
                    },
                    telemetryProps,
                    router
                  )
                }
              }}
            >
              {config.enabled ? `Stop listening` : `Start listening`}
            </Button>
          </Tooltip.Trigger>
          {config.channelName.length === 0 && (
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-alternative py-1 px-2 leading-none shadow',
                    'border border-background',
                  ].join(' ')}
                >
                  <span className="text-xs text-foreground">
                    You'll need to join a channel first
                  </span>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          )}
        </Tooltip.Root>
      </div>
      <RealtimeFilterPopover config={config} onChangeConfig={onChangeConfig} />
    </div>
  )
}
