import { useState } from 'react'

import { useParams } from 'common'
import EventsTable from './EventsTable'
import { Header } from './Header'
import { SendEventModal } from './SendEventModal'
import { RealtimeConfig, useRealtimeEvents } from './useRealtimeEvents'

/**
 * Acts as a container component for the entire log display
 */
export const RealtimeInspector = () => {
  const { ref } = useParams()
  const [sendEventShown, setSendEventShown] = useState(false)

  const [realtimeConfig, setRealtimeConfig] = useState<RealtimeConfig>({
    enabled: false,
    projectRef: ref!,
    channelName: 'room_a',
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

  const { logData, sendEvent } = useRealtimeEvents(realtimeConfig)

  return (
    <div className="flex flex-col flex-grow h-full">
      <Header config={realtimeConfig} onChangeConfig={setRealtimeConfig} />
      <div className="relative flex flex-col flex-grow h-full">
        <div className="flex h-full">
          <EventsTable
            enabled={realtimeConfig.enabled}
            data={logData}
            showSendEvent={() => setSendEventShown(true)}
          />
        </div>
      </div>
      <SendEventModal
        visible={sendEventShown}
        onSelectCancel={() => setSendEventShown(false)}
        onSelectConfirm={() => {
          sendEvent('event', {})
          setSendEventShown(false)
        }}
      />
    </div>
  )
}
