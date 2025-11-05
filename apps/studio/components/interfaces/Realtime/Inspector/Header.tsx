import { PermissionAction } from '@supabase/shared-types/out/constants'
import { PlayCircle, StopCircle } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'

import { IS_PLATFORM, useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { getTemporaryAPIKey } from 'data/api-keys/temp-api-keys-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
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
  const { data: org } = useSelectedOrganizationQuery()

  const { can: canReadAPIKeys } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )

  return (
    <div className="flex flex-row h-14 gap-2.5 items-center px-4">
      <div className="flex flex-row">
        <ChooseChannelPopover config={config} onChangeConfig={onChangeConfig} />
        <RealtimeTokensPopover config={config} onChangeConfig={onChangeConfig} />
        <ButtonTooltip
          size="tiny"
          type={config.enabled ? 'warning' : 'primary'}
          className="rounded-l-none border-l-0"
          disabled={!canReadAPIKeys || config.channelName.length === 0}
          icon={config.enabled ? <StopCircle size="16" /> : <PlayCircle size="16" />}
          onClick={async () => {
            // [Joshen] Refresh if starting to listen + using temp API key, since it has a low refresh rate
            if (!config.enabled && (config.token.startsWith('sb_temp') || !IS_PLATFORM)) {
              const data = await getTemporaryAPIKey({ projectRef: config.projectRef, expiry: 3600 })
              const token = data.api_key
              onChangeConfig({ ...config, token, enabled: !config.enabled })
            } else {
              onChangeConfig({ ...config, enabled: !config.enabled })
            }

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
      </div>
      <RealtimeFilterPopover config={config} onChangeConfig={onChangeConfig} />
    </div>
  )
}
