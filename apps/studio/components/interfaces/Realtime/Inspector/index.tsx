import { useParams } from 'common'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MousePointer2 } from 'lucide-react'

import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Header } from './Header'
import MessagesTable from './MessagesTable'
import { SendMessageModal } from './SendMessageModal'
import { RealtimeConfig, useRealtimeMessages } from './useRealtimeMessages'
import { EmptyRealtime } from './EmptyRealtime'

/**
 * Acts as a container component for the entire log display
 */
export const RealtimeInspector = () => {
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()

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

  const { mutate: sendEvent } = useSendEventMutation()
  const { logData, sendMessage } = useRealtimeMessages(realtimeConfig, setRealtimeConfig)

  return (
    <div className="flex flex-col grow h-full">
      <Header config={realtimeConfig} onChangeConfig={setRealtimeConfig} />
      <div className="relative flex flex-col grow">
        <div className="flex grow">
          {(logData ?? []).length > 0 ? (
            <MessagesTable
              hasChannelSet={realtimeConfig.channelName.length > 0}
              enabled={realtimeConfig.enabled}
              data={logData}
              showSendMessage={() => setSendMessageShown(true)}
            />
          ) : (
            <EmptyRealtime projectRef={ref!} />
          )}
        </div>
      </div>
      <SendMessageModal
        visible={sendMessageShown}
        onSelectCancel={() => setSendMessageShown(false)}
        onSelectConfirm={(v) => {
          sendEvent({
            action: 'realtime_inspector_broadcast_sent',
            groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
          })
          sendMessage(v.message, v.payload, () => setSendMessageShown(false))
        }}
      />
    </div>
  )
}
