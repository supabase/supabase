import { useParams, useTelemetryProps } from 'common'
import { useRouter } from 'next/router'
import { useState } from 'react'

import Telemetry from 'lib/telemetry'
import { Header } from './Header'
import MessagesTable from './MessagesTable'
import { SendMessageModal } from './SendMessageModal'
import { RealtimeConfig, useRealtimeMessages } from './useRealtimeMessages'

/**
 * Acts as a container component for the entire log display
 */
export const RealtimeInspector = () => {
  const { ref } = useParams()
  const telemetryProps = useTelemetryProps()
  const router = useRouter()
  const [sendMessageShown, setSendMessageShown] = useState(false)

  const [realtimeConfig, setRealtimeConfig] = useState<RealtimeConfig>({
    enabled: false,
    projectRef: ref!,
    channelName: '',
    logLevel: 'info',
    token: '', // will be filled out by RealtimeTokensPopover
    schema: 'public',
    table: '*',
    isChannelPrivate: false,
    filter: undefined,
    bearer: null,
    enablePresence: true,
    enableDbChanges: true,
    enableBroadcast: true,
  })

  const { logData, sendMessage } = useRealtimeMessages(realtimeConfig, setRealtimeConfig)

  return (
    <div className="flex flex-col grow h-full">
      <Header config={realtimeConfig} onChangeConfig={setRealtimeConfig} />
      <div className="relative flex flex-col grow">
        <div className="flex grow">
          <MessagesTable
            hasChannelSet={realtimeConfig.channelName.length > 0}
            enabled={realtimeConfig.enabled}
            data={logData}
            showSendMessage={() => setSendMessageShown(true)}
          />
        </div>
      </div>
      <SendMessageModal
        visible={sendMessageShown}
        onSelectCancel={() => setSendMessageShown(false)}
        onSelectConfirm={(v) => {
          Telemetry.sendEvent(
            {
              category: 'realtime_inspector',
              action: 'send_broadcast_message',
              label: 'realtime_inspector_results',
            },
            telemetryProps,
            router
          )
          sendMessage(v.message, v.payload, () => setSendMessageShown(false))
        }}
      />
    </div>
  )
}
