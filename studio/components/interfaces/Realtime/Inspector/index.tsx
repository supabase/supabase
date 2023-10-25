import { useState } from 'react'

import EventsTable from './EventsTable'
import { Header } from './Header'
import { RealtimeConfig, useRealtimeEvents } from './useRealtimeEvents'

/**
 * Acts as a container component for the entire log display
 */
export const RealtimeInspector = () => {
  const [realtimeConfig, setRealtimeConfig] = useState<RealtimeConfig>({
    enabled: false,
    projectRef: '',
    channelName: 'room_a',
    logLevel: 'info',
    token: '',
    schema: 'public',
    table: '*',
    tableId: undefined,
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
          <EventsTable enabled={realtimeConfig.enabled} data={logData} />
        </div>
      </div>
    </div>
  )
}
