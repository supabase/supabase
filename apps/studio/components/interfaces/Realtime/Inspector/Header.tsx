import { PlayCircle, StopCircle } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'
import { Button } from 'ui'

import { ChooseChannelPopover } from './ChooseChannelPopover'
import { RealtimeFilterPopover } from './RealtimeFilterPopover'
import { RealtimeTokensPopover } from './RealtimeTokensPopover'
import { RealtimeConfig } from './useRealtimeMessages'

interface HeaderProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

export const Header = ({ config, onChangeConfig }: HeaderProps) => {
  return (
    <div className="flex flex-row h-14 gap-2.5 items-center px-4">
      <div className="flex flex-row">
        <ChooseChannelPopover config={config} onChangeConfig={onChangeConfig} />
        <Button
          size="tiny"
          type={config.enabled ? 'warning' : 'primary'}
          className="rounded-l-none border-l-0"
          disabled={config.channelName.length === 0}
          icon={config.enabled ? <StopCircle size="16" /> : <PlayCircle size="16" />}
          onClick={() => onChangeConfig({ ...config, enabled: !config.enabled })}
        >
          {config.enabled ? `Stop listening` : `Start listening`}
        </Button>
      </div>
      <RealtimeTokensPopover config={config} onChangeConfig={onChangeConfig} />
      <RealtimeFilterPopover config={config} onChangeConfig={onChangeConfig} />
    </div>
  )
}
