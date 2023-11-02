import { useState } from 'react'

import { useParams } from 'common'
import MessagesTable from './EventsTable'
import { Header } from './Header'
import { SendMessageModal } from './SendEventModal'
import { RealtimeConfig, useRealtimeMessages } from './useRealtimeEvents'

/**
 * Acts as a container component for the entire log display
 */
export const RealtimeInspector = () => {
  const { ref } = useParams()
  const [sendMessageShown, setSendMessageShown] = useState(false)

  const [realtimeConfig, setRealtimeConfig] = useState<RealtimeConfig>({
    enabled: false,
    projectRef: ref!,
    channelName: '',
    logLevel: 'info',
    token: '', // will be filled out by RealtimeTokensPopover
    schema: 'public',
    table: '*',
    filter: undefined,
    bearer: null,
    enablePresence: true,
    enableDbChanges: true,
    enableBroadcast: true,
  })

  const { logData, sendMessage } = useRealtimeMessages(realtimeConfig)

  return (
    <div className="flex flex-col flex-grow h-full">
      <Header config={realtimeConfig} onChangeConfig={setRealtimeConfig} />
      <div className="relative flex flex-col flex-grow h-full">
        <div className="flex h-full">
          <MessagesTable
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
          sendMessage(v.message, v.payload)
          setSendMessageShown(false)
        }}
      />
    </div>
  )
}
