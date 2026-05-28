import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM } from 'common'
import { PlayCircle, StopCircle } from 'lucide-react'
import { Dispatch, SetStateAction, useCallback } from 'react'
import { Button } from 'ui'

import { ChooseChannelPopover } from './ChooseChannelPopover'
import { RealtimeFilterPopover } from './RealtimeFilterPopover'
import { RealtimeTokensPopover } from './RealtimeTokensPopover'
import { RealtimeConfig } from './useRealtimeMessages'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { getTemporaryAPIKey } from '@/data/api-keys/temp-api-keys-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useTrack } from '@/lib/telemetry/track'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface HeaderProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
  channelPopoverOpen: boolean
  onChannelPopoverChange: (open: boolean) => void
  filterPopoverOpen: boolean
  onFilterPopoverChange: (open: boolean) => void
}

export const Header = ({
  config,
  onChangeConfig,
  channelPopoverOpen,
  onChannelPopoverChange,
  filterPopoverOpen,
  onFilterPopoverChange,
}: HeaderProps) => {
  const track = useTrack()

  const { can: canReadAPIKeys } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )

  const canToggleListening = canReadAPIKeys && config.channelName.length > 0

  const handleToggleListening = useCallback(async () => {
    const willStartListening = !config.enabled
    // [Joshen] Refresh if starting to listen + using temp API key, since it has a low refresh rate
    if (willStartListening && (config.token.startsWith('sb_temp') || !IS_PLATFORM)) {
      const data = await getTemporaryAPIKey({ projectRef: config.projectRef, expiry: 3600 })
      const token = data.api_key
      onChangeConfig({ ...config, token, enabled: !config.enabled })
    } else {
      onChangeConfig({ ...config, enabled: !config.enabled })
    }

    if (willStartListening) {
      track('realtime_inspector_listen_channel_clicked')
    }
  }, [config, onChangeConfig, track])

  useShortcut(SHORTCUT_IDS.INSPECTOR_TOGGLE_LISTENING, handleToggleListening, {
    enabled: canToggleListening,
  })

  const listeningButton = (
    <Button
      size="tiny"
      type={config.enabled ? 'warning' : 'primary'}
      className="rounded-l-none border-l-0"
      disabled={!canToggleListening}
      icon={config.enabled ? <StopCircle size="16" /> : <PlayCircle size="16" />}
      onClick={handleToggleListening}
    >
      {config.enabled ? `Stop listening` : `Start listening`}
    </Button>
  )

  return (
    <div className="flex flex-row min-h-14 md:min-h-(--header-height) gap-2.5 items-center px-4 border-b ">
      <div className="flex flex-row">
        <ChooseChannelPopover
          config={config}
          onChangeConfig={onChangeConfig}
          open={channelPopoverOpen}
          onOpenChange={onChannelPopoverChange}
        />
        <RealtimeTokensPopover config={config} onChangeConfig={onChangeConfig} />
        {canToggleListening ? (
          <ShortcutTooltip shortcutId={SHORTCUT_IDS.INSPECTOR_TOGGLE_LISTENING} side="bottom">
            {listeningButton}
          </ShortcutTooltip>
        ) : (
          <ButtonTooltip
            size="tiny"
            type={config.enabled ? 'warning' : 'primary'}
            className="rounded-l-none border-l-0"
            disabled
            icon={config.enabled ? <StopCircle size="16" /> : <PlayCircle size="16" />}
            onClick={handleToggleListening}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canReadAPIKeys
                  ? 'You need additional permissions to use the realtime inspector'
                  : config.channelName.length === 0
                    ? 'You need to join a channel first'
                    : undefined,
              },
            }}
          >
            {config.enabled ? `Stop listening` : `Start listening`}
          </ButtonTooltip>
        )}
      </div>
      <RealtimeFilterPopover
        config={config}
        onChangeConfig={onChangeConfig}
        open={filterPopoverOpen}
        onOpenChange={onFilterPopoverChange}
      />
    </div>
  )
}
