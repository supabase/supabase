import { useParams } from 'common'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useEffect, useState } from 'react'

import { EmptyRealtime } from './EmptyRealtime'
import { Header } from './Header'
import MessagesTable from './MessagesTable'
import { SendMessageModal } from './SendMessageModal'
import { RealtimeConfig, useRealtimeMessages } from './useRealtimeMessages'

/**
 * Acts as a container component for the entire log display
 */
export const RealtimeInspector = () => {
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()

  // Check if realtime publications are available
  const { data: publications } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const realtimePublication = (publications ?? []).find(
    (publication) => publication.name === 'supabase_realtime'
  )
  const isRealtimeAvailable =
    !!realtimePublication &&
    ((realtimePublication?.tables ?? []).length > 0 || realtimePublication?.tables === null)

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
    enableDbChanges: isRealtimeAvailable, // Initialize based on publications availability
    enableBroadcast: true,
  })

  const { mutate: sendEvent } = useSendEventMutation()
  const { logData, sendMessage } = useRealtimeMessages(realtimeConfig, setRealtimeConfig)

  // Update enableDbChanges when publications change
  useEffect(() => {
    setRealtimeConfig((prev) => ({ ...prev, enableDbChanges: isRealtimeAvailable }))
  }, [isRealtimeAvailable])

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
